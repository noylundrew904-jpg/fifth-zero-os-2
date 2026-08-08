/* ============================================================
   NOEL OS — assistant (rule-based, Level 1)
   ------------------------------------------------------------
   Answers questions using ONLY data already stored in NoelData.
   Nothing here is generated or guessed — every answer is a
   template filled in from real records, so it can never
   fabricate a number or a fact. Anything it can't answer this
   way says so plainly instead of guessing (see AI FALLBACK).
   ============================================================ */

const PRIORITY_EMOJI = { P1: '🔴', P2: '🟠', P3: '🟡', P4: '⚪' };

function fmtTaskLine(t) {
  const bits = [t.client, t.project, t.due_date].filter(Boolean).join(' · ');
  return `${PRIORITY_EMOJI[t.priority] || '⚪'} ${t.title}${bits ? ` (${bits})` : ''}`;
}

function answerToday() {
  const top = NoelData.getTodayPriorities(3);
  const money = NoelData.getMoneySummary();
  const pipeline = NoelData.getPipeline().filter(p => p.stage === 'IN TALKS' || p.stage === 'FORECAST');
  const lines = [];
  lines.push('**Top priorities today:**');
  if (top.length === 0) lines.push('Nothing urgent — good day to create.');
  else top.forEach(t => lines.push('• ' + fmtTaskLine(t)));
  if (money.debt > 0) lines.push(`\n**Money needing attention:** ${NoelData.formatINR(money.debt)} in debt, ${NoelData.formatINR(money.receivables)} expected in.`);
  if (pipeline.length) lines.push(`\n**Follow up:** ${pipeline.map(p => p.client).join(', ')}.`);
  const next = top[0];
  lines.push(`\n**One next action:** ${next ? next.title : 'Capture something — your inbox is empty.'}`);
  return lines.join('\n');
}

function answerDebt() {
  const debts = NoelData.getDebts().filter(d => d.status !== 'paid');
  const total = NoelData.totalDebt();
  if (debts.length === 0) return "You're debt-free. 🎉";
  const list = debts.slice(0, 5).map((d, idx) => `${idx + 1}. ${d.person || d.name} — ${NoelData.formatINR(d.amount)}`).join('\n');
  return `**Total remaining debt: ${NoelData.formatINR(total)}**\n\n${list}${debts.length > 5 ? `\n…and ${debts.length - 5} more.` : ''}`;
}

function answerDebtFreeWhen() {
  const total = NoelData.totalDebt();
  const settings = NoelData.getSettings();
  const recurring = NoelData.getRecurringCommitments().reduce((s, r) => s + (r.remainingMonths > 0 ? r.amount : 0), 0);
  const freeCashFlow = settings.salaryNet - settings.monthlyBurn - recurring;
  if (total === 0) return "You're already debt-free.";
  if (freeCashFlow <= 0) {
    return `At your current burn (${NoelData.formatINR(settings.monthlyBurn)}/mo) plus recurring commitments (${NoelData.formatINR(recurring)}/mo), there's no free cash flow left from your ${NoelData.formatINR(settings.salaryNet)} net salary to put toward debt. You'd need extra income (client payments) to make progress.`;
  }
  const months = Math.ceil(total / freeCashFlow);
  return `At roughly ${NoelData.formatINR(freeCashFlow)}/month free after your ${NoelData.formatINR(settings.monthlyBurn)} burn and recurring commitments, clearing ${NoelData.formatINR(total)} of debt would take about **${months} months** — faster if client payments (${NoelData.formatINR(NoelData.totalReceivables())} pending) land sooner.`;
}

function answerReceivables() {
  const rec = NoelData.getReceivables();
  const total = NoelData.totalReceivables();
  const pending = rec.filter(r => r.status === 'pending' && typeof r.amount === 'number');
  const tbd = rec.filter(r => r.status === 'tbd');
  const list = pending.map(r => `• ${r.name} — ${NoelData.formatINR(r.amount)}`).join('\n');
  return `**Expecting ${NoelData.formatINR(total)}** (confirmed amounts):\n${list}${tbd.length ? `\n\nStill TBD: ${tbd.map(r => r.name).join(', ')}` : ''}`;
}

function answerFollowUps() {
  const pipeline = NoelData.getPipeline();
  const leads = NoelData.getLeads();
  const lines = ['**Sales pipeline:**'];
  pipeline.forEach(p => {
    const amt = p.amount ? NoelData.formatINR(p.amount) : `${NoelData.formatINR(p.amountLow)}–${NoelData.formatINR(p.amountHigh)}`;
    lines.push(`• ${p.client} — ${p.description} (${amt}) — ${p.stage}`);
  });
  lines.push('\n**Open leads:**');
  leads.slice(0, 5).forEach(l => lines.push('• ' + l.name));
  return lines.join('\n');
}

function answerFifthZero() {
  const board = NoelData.getFifthZero();
  const dot = { red: '🔴', yellow: '🟡', green: '🟢' };
  return '**Fifth & Zero:**\n' + board.map(f => `${dot[f.status] || '⚪'} ${f.name}`).join('\n');
}

function answerEntity(name) {
  const results = NoelData.globalSearch(name);
  const lines = [`**What I know about ${name}:**`];
  if (results.notes.length) lines.push('\nNotes:\n' + results.notes.map(n => '• ' + n.text).join('\n'));
  if (results.tasks.length) lines.push('\nTasks:\n' + results.tasks.map(t => '• ' + fmtTaskLine(t)).join('\n'));
  if (results.pipeline.length) lines.push('\nPipeline:\n' + results.pipeline.map(p => `• ${p.description} — ${p.stage}`).join('\n'));
  if (results.ideas.length) lines.push('\nIdeas:\n' + results.ideas.map(i => '• ' + i.text).join('\n'));
  if (lines.length === 1) lines.push("\nNothing stored yet. Capture a note or task and I'll remember it.");
  return lines.join('\n');
}

function answerIdeas(filterFz) {
  let ideas = NoelData.getIdeas();
  if (filterFz) ideas = ideas.filter(i => i.category === 'Fifth & Zero' || i.project === 'Fifth & Zero');
  if (!ideas.length) return 'No ideas captured yet. Say "Idea — …" any time.';
  const badge = { HOT: '🔥', INTERESTING: '⭐', SOMEDAY: '💭' };
  return ideas.map(i => `${badge[i.priority] || '💭'} ${i.text}`).join('\n');
}

function answerWeeklyReview() {
  const money = NoelData.getMoneySummary();
  const tasksDone = NoelData.getTasks().filter(t => t.status === 'Completed').length;
  const pipeline = NoelData.getPipeline();
  return [
    '**Weekly review**',
    `Cash ${NoelData.formatINR(money.cash)} · Receivables ${NoelData.formatINR(money.receivables)} · Debt ${NoelData.formatINR(money.debt)}`,
    `Tasks completed: ${tasksDone}`,
    `Pipeline: ${pipeline.map(p => `${p.client} (${p.stage})`).join(', ') || 'quiet'}`,
    `Ideas captured: ${NoelData.getIdeas().length}`,
    '\nNext week — pick 3 priorities from Tasks and hold to talk to capture anything new.',
  ].join('\n');
}

function answerQuery(raw) {
  const q = raw.trim().toLowerCase();
  if (/what should i do today|today'?s priorities|^today\b/.test(q)) return answerToday();
  if (/how much debt|debt (do i have|total)|^debt\b/.test(q)) return answerDebt();
  if (/when can i (clear|be free of|pay off) (my )?debt|debt.?free/.test(q)) return answerDebtFreeWhen();
  if (/what money am i expecting|receivables|who owes me/.test(q)) return answerReceivables();
  if (/who should i follow up|follow.?ups?\b|pipeline/.test(q)) return answerFollowUps();
  if (/fifth\s*&?\s*zero/.test(q) && /ideas/.test(q)) return answerIdeas(true);
  if (/show (all )?ideas|^ideas\b/.test(q)) return answerIdeas(false);
  if (/fifth\s*&?\s*zero/.test(q)) return answerFifthZero();
  if (/weekly review/.test(q)) return answerWeeklyReview();
  if (/highest priority tasks|top tasks/.test(q)) return answerToday();
  const entityMatch = raw.match(/(?:know about|decide about|decided about)\s+([A-Za-z][\w& ]*)\??$/i);
  if (entityMatch) return answerEntity(entityMatch[1].trim());
  const searchMatch = raw.match(/^search\s+(.+)/i);
  if (searchMatch) return answerEntity(searchMatch[1].trim());

  return "I can't reason about that yet without an AI model connected (Phase 7). I can answer from your real data though — try \"What should I do today?\", \"How much debt do I have?\", \"What money am I expecting?\", \"Who should I follow up with?\", or \"What do I know about Sonia?\"";
}

const NoelAssistant = { answerQuery };
