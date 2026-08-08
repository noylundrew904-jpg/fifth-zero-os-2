/* ============================================================
   NOEL OS — Level 1 deterministic parser
   ------------------------------------------------------------
   Pure JS / regex classification. No network call, no AI, no
   token cost. Only used when this CANNOT confidently classify
   an input does the app fall back to the (not-yet-connected)
   AI layer — see assistant.js / Settings → AI Fallback.
   ============================================================ */

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const EXPENSE_CATEGORY_KEYWORDS = [
  [/\b(food|lunch|dinner|breakfast|coffee|snack|restaurant|zomato|swiggy)\b/i, 'Food'],
  [/\b(fuel|petrol|diesel|gas station)\b/i, 'Fuel'],
  [/\b(grocery|groceries|supermarket)\b/i, 'Groceries'],
  [/\b(rent)\b/i, 'Rent'],
  [/\b(uber|ola|cab|taxi|flight|travel|train)\b/i, 'Travel'],
  [/\b(shopping|clothes|clothing)\b/i, 'Shopping'],
  [/\b(bill|bills|electricity|internet|recharge|wifi)\b/i, 'Bills'],
  [/\b(movie|netflix|entertainment|spotify)\b/i, 'Entertainment'],
  [/\b(health|medicine|doctor|pharmacy)\b/i, 'Health'],
];

function extractAmount(text) {
  let m = text.match(/₹\s?([\d,]+(?:\.\d+)?)\s?(k\b)?/i);
  if (!m) m = text.match(/\b([\d,]+(?:\.\d+)?)\s?(k)?\s?(?:rupees|rs\.?|inr)\b/i);
  if (!m) m = text.match(/\b([\d,]+(?:\.\d+)?)\s?(k)\b/i);
  if (!m) return null;
  let n = parseFloat(m[1].replace(/,/g, ''));
  if (m[2] && /k/i.test(m[2])) n *= 1000;
  return isNaN(n) ? null : n;
}

function extractCategory(text) {
  for (const [re, cat] of EXPENSE_CATEGORY_KEYWORDS) if (re.test(text)) return cat;
  return 'Misc';
}

function extractDueDate(text) {
  const t = text.toLowerCase();
  const today = new Date();
  if (/\btoday\b/.test(t)) return NoelData.isoDateOnly(today);
  if (/\btomorrow\b/.test(t)) return NoelData.isoDateOnly(NoelData.addDays(today, 1));
  const nextWeekday = t.match(/\bnext\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (nextWeekday) {
    const target = WEEKDAYS.indexOf(nextWeekday[1]);
    const diff = ((target - today.getDay() + 7) % 7) || 7;
    return NoelData.isoDateOnly(NoelData.addDays(today, diff + 7 >= 14 ? diff : diff));
  }
  const thisWeekday = t.match(/\bthis\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (thisWeekday) {
    const target = WEEKDAYS.indexOf(thisWeekday[1]);
    const diff = (target - today.getDay() + 7) % 7;
    return NoelData.isoDateOnly(NoelData.addDays(today, diff));
  }
  return null;
}

function findKnownPerson(text, list, keyFn) {
  const lower = text.toLowerCase();
  let best = null;
  for (const item of list) {
    const name = (keyFn ? keyFn(item) : item.name || '').toLowerCase();
    if (!name) continue;
    const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(text)) {
      if (!best || name.length > best.name.length) best = { item, name, index: lower.indexOf(name) };
    }
  }
  return best;
}

function detectUrgency(text) {
  return /\b(extremely important|urgent|asap|critical|today|right away)\b/i.test(text);
}

/* Returns { type, confidence, fields } for a single clause. */
function classifySegment(raw) {
  const text = raw.trim();
  if (!text) return null;
  const amount = extractAmount(text);
  const hasPaidVerb = /\bpaid\b/i.test(text);
  const hasPayVerb = /\bpay\b/i.test(text);
  const hasReceivedVerb = /\breceived\b/i.test(text);
  const paidIdx = text.toLowerCase().search(/\bpaid\b/);

  // ---- money: debt payment / income received / plain expense ----
  if (amount !== null) {
    const debtHit = findKnownPerson(text, NoelData.getDebts(), d => d.person || d.name);
    const recvHit = findKnownPerson(text, NoelData.getReceivables(), r => r.name);

    if ((hasPaidVerb || hasPayVerb) && debtHit) {
      const nameIdx = text.toLowerCase().indexOf(debtHit.name);
      const verbBeforeName = paidIdx !== -1 && paidIdx < nameIdx;
      if (verbBeforeName || !recvHit) {
        return { type: 'Debt Payment', confidence: 0.95, fields: { person: debtHit.item.person || debtHit.item.name, debtId: debtHit.item.id, amount } };
      }
    }
    if (recvHit && (hasReceivedVerb || hasPaidVerb)) {
      const nameIdx = text.toLowerCase().indexOf(recvHit.name);
      const nameBeforeVerb = paidIdx === -1 || nameIdx < paidIdx;
      if (hasReceivedVerb || nameBeforeVerb) {
        return { type: 'Income', confidence: 0.95, fields: { person: recvHit.item.name, receivableId: recvHit.item.id, amount } };
      }
    }
    if (hasReceivedVerb) {
      const fromMatch = text.match(/from\s+([A-Za-z][\w& ]*)/i);
      return { type: 'Income', confidence: fromMatch ? 0.9 : 0.7, fields: { person: fromMatch ? fromMatch[1].trim() : null, receivableId: null, amount } };
    }
    if (/\b(spent|spend|paid for)\b/i.test(text) || /^₹/.test(text) || /₹\s?[\d,]+.*\bon\b/i.test(text)) {
      return { type: 'Expense', confidence: 0.9, fields: { amount, category: extractCategory(text) } };
    }
    // bare "₹850 food" style
    if (/₹\s?[\d,]+/.test(text)) {
      return { type: 'Expense', confidence: 0.75, fields: { amount, category: extractCategory(text) } };
    }
  }

  // ---- idea ----
  if (/\bidea\b/i.test(text) || /^what if\b/i.test(text)) {
    let clean = text.replace(/^idea\s*(for|[-—:])?\s*/i, '').trim();
    const fzHit = /fifth\s*&?\s*zero/i.test(text);
    return { type: 'Idea', confidence: 0.9, fields: { text: clean || text, category: fzHit ? 'Fifth & Zero' : 'Creative', project: fzHit ? 'Fifth & Zero' : null } };
  }

  // ---- note ----
  if (/^remember\b/i.test(text) || /\bnote[:\-]/i.test(text)) {
    const clean = text.replace(/^remember\s*(that)?\s*/i, '').replace(/^note[:\-]\s*/i, '').trim();
    const clientHit = findKnownPerson(text, NoelData.getClients());
    return { type: 'Note', confidence: 0.9, fields: { text: clean || text, category: clientHit ? 'Client' : 'Personal', client: clientHit ? clientHit.item.name : null } };
  }

  // ---- task ----
  const taskTriggers = /\b(need to|remind me( to)?|follow up|call |send |finish |complete |prepare |task[:\-])/i;
  if (taskTriggers.test(text)) {
    let title = text
      .replace(/^task[:\-]\s*/i, '')
      .replace(/^remind me( to)?\s*/i, '')
      .replace(/^i need to\s*/i, '')
      .replace(/^need to\s*/i, '')
      .trim();
    title = title.replace(/\s*(today|tomorrow|next\s+\w+|this\s+\w+)[.!\s]*$/i, '').trim();
    title = title.replace(/[.\s]+$/, '');
    title = title.charAt(0).toUpperCase() + title.slice(1);
    const due = extractDueDate(text);
    const clientHit = findKnownPerson(text, NoelData.getClients());
    const fzHit = /fifth\s*&?\s*zero/i.test(text);
    let priority = 'P3';
    if (due === NoelData.isoDateOnly(new Date())) priority = 'P1';
    else if (due) priority = 'P2';
    if (detectUrgency(text)) priority = 'P1';
    return {
      type: 'Task', confidence: 0.88,
      fields: {
        title, due_date: due, priority,
        category: fzHit ? 'Fifth & Zero' : (clientHit ? 'Client Work' : 'Personal'),
        client: clientHit ? clientHit.item.name : null,
        project: fzHit ? 'Fifth & Zero' : null,
      },
    };
  }

  return { type: 'Ambiguous', confidence: 0.35, fields: { text } };
}

function splitClauses(input) {
  // Require at least one space after a comma so thousand-separators like
  // "₹5,000" (no space after the comma) are never mistaken for a clause break.
  return input
    .split(/,\s+(?:and\s+)?|\s+and\s+(?=[a-z0-9₹])/i)
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * parseCapture(rawText) -> { actions: [...], raw }
 * Each action: { type, confidence, fields, raw, needsConfirmation }
 */
function parseCapture(rawText) {
  const clauses = splitClauses(rawText);
  const segments = clauses.length > 1 ? clauses : [rawText];
  const actions = segments.map(seg => {
    const result = classifySegment(seg);
    if (!result) return null;
    const financial = ['Expense', 'Income', 'Debt Payment'].includes(result.type);
    return {
      ...result,
      raw: seg,
      needsConfirmation: financial || result.confidence < 0.8,
    };
  }).filter(Boolean);
  return { raw: rawText, actions, isMultiAction: actions.length > 1 };
}

const NoelParser = { parseCapture, classifySegment, extractAmount, extractCategory, extractDueDate };
