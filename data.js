/* ============================================================
   NOEL OS — data layer
   ------------------------------------------------------------
   This is the ONLY module that touches storage. Everything else
   (UI, parser, assistant) calls the functions below.

   Today this persists to localStorage, seeded with realistic
   starting data so the app is fully usable with zero setup.
   Every function here is written so a later phase can swap the
   body for a Google Sheets / Docs read-write call without any
   UI code changing — see README "Data abstraction" section.
   ============================================================ */

const STORAGE_KEY = 'noelos_v1';
const SCHEMA_VERSION = 1;

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
function nowIso() { return new Date().toISOString(); }
function formatINR(n) {
  if (n === null || n === undefined) return '—';
  return '₹' + Math.round(n).toLocaleString('en-IN');
}
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function isoDateOnly(d) { return d.toISOString().slice(0, 10); }

/* ---------------- seed data ---------------- */
function seedDatabase() {
  const today = new Date();
  const tomorrow = isoDateOnly(addDays(today, 1));
  const nextFriday = isoDateOnly(addDays(today, ((5 - today.getDay() + 7) % 7) || 7));

  return {
    version: SCHEMA_VERSION,
    settings: {
      name: 'Noel',
      cash: 3000,
      monthlyBurn: 55000,
      salaryGross: 150000,
      salaryTds: 10000,
      salaryNet: 140000,
      autoConfirmLowRisk: true,
      googleWorkspaceConnected: false,
    },
    tasks: [
      { id: uid('t'), title: 'Finish Sonia proposal', description: '', category: 'Client Work', priority: 'P1', status: 'In Progress', due_date: tomorrow, due_time: null, client: 'Sonia', project: 'Sonia Website', tags: [], source: 'seed', created_at: nowIso(), updated_at: nowIso() },
      { id: uid('t'), title: 'Follow up Azeem', description: '', category: 'Sales', priority: 'P2', status: 'Not Started', due_date: null, due_time: null, client: 'Azeem', project: null, tags: [], source: 'seed', created_at: nowIso(), updated_at: nowIso() },
      { id: uid('t'), title: 'Finish Fifth & Zero homepage', description: '', category: 'Fifth & Zero', priority: 'P2', status: 'In Progress', due_date: null, due_time: null, client: null, project: 'Fifth & Zero Website', tags: [], source: 'seed', created_at: nowIso(), updated_at: nowIso() },
      { id: uid('t'), title: 'Set up Fifth & Zero Instagram', description: '', category: 'Fifth & Zero', priority: 'P3', status: 'Not Started', due_date: null, due_time: null, client: null, project: 'Fifth & Zero Instagram', tags: [], source: 'seed', created_at: nowIso(), updated_at: nowIso() },
      { id: uid('t'), title: 'Draft Karan Aujla spec pitch', description: '', category: 'Fifth & Zero', priority: 'P3', status: 'Not Started', due_date: null, due_time: null, client: null, project: 'Karan Spec', tags: [], source: 'seed', created_at: nowIso(), updated_at: nowIso() },
      { id: uid('t'), title: 'Call Krithika about marketing head intro', description: '', category: 'Follow-ups', priority: 'P3', status: 'Not Started', due_date: null, due_time: null, client: 'Krithika', project: null, tags: [], source: 'seed', created_at: nowIso(), updated_at: nowIso() },
    ],
    ideas: [
      { id: uid('i'), text: 'Fifth & Zero campaign where brands behave like people', category: 'Fifth & Zero', project: 'Fifth & Zero', client: null, tags: ['campaign'], priority: 'HOT', status: 'Inbox', created_at: nowIso(), source: 'seed' },
      { id: uid('i'), text: "Concept for Karan Aujla's next video", category: 'Content', project: 'Karan Spec', client: null, tags: [], priority: 'INTERESTING', status: 'Inbox', created_at: nowIso(), source: 'seed' },
      { id: uid('i'), text: 'Productised brand film package', category: 'Business', project: null, client: null, tags: [], priority: 'SOMEDAY', status: 'Inbox', created_at: nowIso(), source: 'seed' },
    ],
    notes: [
      { id: uid('n'), text: "Sonia prefers minimal websites and doesn't like excessive animation.", category: 'Client', client: 'Sonia', project: 'Sonia Website', created_at: nowIso(), source: 'seed' },
      { id: uid('n'), text: "Azeem's brand prefers cinematic visuals.", category: 'Client', client: 'Azeem', project: null, created_at: nowIso(), source: 'seed' },
      { id: uid('n'), text: 'Krithika said marketing heads usually get involved after founder approval.', category: 'Business', client: 'Krithika', project: null, created_at: nowIso(), source: 'seed' },
    ],
    debts: [
      { id: uid('d'), name: 'Clyde', amount: 5000, order: 1, status: 'pending' },
      { id: uid('d'), name: 'Marlyne (priority payment)', person: 'Marlyne', amount: 50000, order: 2, status: 'pending' },
      { id: uid('d'), name: 'Dad (priority payment)', person: 'Dad', amount: 30000, order: 3, status: 'pending' },
      { id: uid('d'), name: 'HDFC Card', person: 'HDFC Card', amount: 11052, order: 4, status: 'pending' },
      { id: uid('d'), name: 'ICICI Card', person: 'ICICI Card', amount: 26472, order: 5, status: 'pending' },
      { id: uid('d'), name: 'Marlyne (remaining)', person: 'Marlyne', amount: 50000, order: 6, status: 'pending' },
      { id: uid('d'), name: 'Dad (remaining)', person: 'Dad', amount: 50000, order: 7, status: 'pending' },
      { id: uid('d'), name: 'Mai', person: 'Mai', amount: 530000, order: 8, status: 'pending' },
    ],
    recurringCommitments: [
      { id: uid('r'), name: 'CRED', amount: 13135, termMonths: 24, remainingMonths: 24 },
      { id: uid('r'), name: 'Bluestone', amount: 5000, termMonths: 11, remainingMonths: 11 },
    ],
    receivables: [
      { id: uid('rc'), name: 'Suraj', amount: 4800, status: 'pending' },
      { id: uid('rc'), name: 'Testimonial video edit', amount: 9000, status: 'pending' },
      { id: uid('rc'), name: 'Shoot reimbursement', amount: null, status: 'tbd' },
      { id: uid('rc'), name: 'Azeem', amount: 30000, status: 'pending' },
      { id: uid('rc'), name: 'Ayush', amount: 20000, status: 'pending' },
      { id: uid('rc'), name: 'Shreya', amount: 35000, status: 'pending' },
      { id: uid('rc'), name: 'Shailesh', amount: 6400, status: 'pending' },
    ],
    clients: [
      { id: uid('c'), name: 'Sonia', status: 'active', tag: 'HOT' },
      { id: uid('c'), name: 'Azeem', status: 'active', tag: 'WARM' },
      { id: uid('c'), name: 'Shreya', status: 'prospect', tag: 'WARM' },
      { id: uid('c'), name: 'Krithika', status: 'prospect', tag: 'WARM' },
    ],
    pipeline: [
      { id: uid('p'), client: 'Sonia', description: 'Website', amount: 120000, recurring: 55000, stage: 'IN TALKS' },
      { id: uid('p'), client: 'Shreya', description: 'Four-video trial', amountLow: 60000, amountHigh: 80000, stage: 'FORECAST' },
      { id: uid('p'), client: 'Azeem', description: 'Additional brand film', amount: 30000, stage: 'POTENTIAL' },
    ],
    leads: [
      { id: uid('l'), name: "Alston Ma'am / Final Tribute company" },
      { id: uid('l'), name: 'Krithika B.A.' },
      { id: uid('l'), name: 'Shiju Thomas' },
      { id: uid('l'), name: "Kaushik's institution" },
      { id: uid('l'), name: 'Marketing head introductions via Krithika' },
      { id: uid('l'), name: 'Asset Tracers' },
      { id: uid('l'), name: 'Additional work from Sonia after first project closes' },
    ],
    fifthZero: [
      { id: 'website', name: 'Website', status: 'yellow', priority: 1, deadline: null },
      { id: 'instagram', name: 'Instagram', status: 'red', priority: 2, deadline: null },
      { id: 'linkedin', name: 'LinkedIn', status: 'red', priority: 3, deadline: null },
      { id: 'karan', name: 'Karan Spec', status: 'red', priority: 4, deadline: null },
    ],
    activityLog: [
      { id: uid('a'), at: nowIso(), input: null, action: 'NOEL OS initialised', result: 'Seeded with your current tasks, debts, receivables and pipeline.', undo: null },
    ],
    inbox: [], // ambiguous captures awaiting classification
  };
}

let DB = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedDatabase();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== SCHEMA_VERSION) return seedDatabase();
    return parsed;
  } catch (e) {
    return seedDatabase();
  }
}
function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(DB)); }
  catch (e) { console.error('NOEL OS: could not persist to localStorage', e); }
}

/* ---------------- activity log ---------------- */
function logActivity(entry) {
  const record = { id: uid('a'), at: nowIso(), undo: null, ...entry };
  DB.activityLog.unshift(record);
  DB.activityLog = DB.activityLog.slice(0, 200);
  persist();
  return record;
}
function getActivityLog(limit) { return limit ? DB.activityLog.slice(0, limit) : DB.activityLog; }

/* ---------------- tasks ---------------- */
function getTasks() { return DB.tasks; }
function findSimilarTask(title) {
  const norm = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  const target = norm(title);
  return DB.tasks.find(t => {
    const a = norm(t.title);
    return a === target || a.includes(target) || target.includes(a);
  });
}
function createTask(fields) {
  const existing = fields.dedupe !== false ? findSimilarTask(fields.title) : null;
  if (existing) return updateTask(existing.id, {
    priority: fields.priority || existing.priority,
    due_date: fields.due_date || existing.due_date,
    status: existing.status === 'Completed' ? 'Not Started' : existing.status,
  });
  const task = {
    id: uid('t'), title: fields.title, description: fields.description || '',
    category: fields.category || 'Personal', priority: fields.priority || 'P3',
    status: fields.status || 'Not Started', due_date: fields.due_date || null,
    due_time: fields.due_time || null, client: fields.client || null,
    project: fields.project || null, tags: fields.tags || [],
    source: fields.source || 'manual', created_at: nowIso(), updated_at: nowIso(),
  };
  DB.tasks.unshift(task);
  persist();
  return task;
}
function updateTask(id, patch) {
  const t = DB.tasks.find(x => x.id === id);
  if (!t) return null;
  Object.assign(t, patch, { updated_at: nowIso() });
  persist();
  return t;
}
function deleteTask(id) { DB.tasks = DB.tasks.filter(t => t.id !== id); persist(); }

/* ---------------- ideas ---------------- */
function getIdeas() { return DB.ideas; }
function createIdea(fields) {
  const idea = {
    id: uid('i'), text: fields.text, category: fields.category || 'Creative',
    project: fields.project || null, client: fields.client || null, tags: fields.tags || [],
    priority: fields.priority || 'INTERESTING', status: fields.status || 'Inbox',
    created_at: nowIso(), source: fields.source || 'manual',
  };
  DB.ideas.unshift(idea);
  persist();
  return idea;
}
function updateIdea(id, patch) {
  const i = DB.ideas.find(x => x.id === id);
  if (!i) return null;
  Object.assign(i, patch);
  persist();
  return i;
}
function deleteIdea(id) { DB.ideas = DB.ideas.filter(i => i.id !== id); persist(); }

/* ---------------- notes ---------------- */
function getNotes() { return DB.notes; }
function createNote(fields) {
  const note = {
    id: uid('n'), text: fields.text, category: fields.category || 'Personal',
    client: fields.client || null, project: fields.project || null,
    created_at: nowIso(), source: fields.source || 'manual',
  };
  DB.notes.unshift(note);
  persist();
  return note;
}
function updateNote(id, patch) {
  const n = DB.notes.find(x => x.id === id);
  if (!n) return null;
  Object.assign(n, patch);
  persist();
  return n;
}
function deleteNote(id) { DB.notes = DB.notes.filter(n => n.id !== id); persist(); }

/* ---------------- finance / debts / receivables ---------------- */
function getSettings() { return DB.settings; }
function updateSettings(patch) { Object.assign(DB.settings, patch); persist(); return DB.settings; }

function getDebts() { return DB.debts.slice().sort((a, b) => a.order - b.order); }
function getRecurringCommitments() { return DB.recurringCommitments; }
function totalDebt() { return DB.debts.filter(d => d.status !== 'paid').reduce((s, d) => s + d.amount, 0); }
function findDebtByPerson(name) {
  const norm = name.toLowerCase();
  return DB.debts.filter(d => d.status !== 'paid').find(d => (d.person || d.name).toLowerCase().includes(norm));
}
function payDebt(debtId, amount) {
  const d = DB.debts.find(x => x.id === debtId);
  if (!d) return null;
  const before = d.amount;
  d.amount = Math.max(0, d.amount - amount);
  if (d.amount === 0) d.status = 'paid';
  persist();
  return { debt: d, before };
}
function undoDebtPayment(debtId, before) {
  const d = DB.debts.find(x => x.id === debtId);
  if (!d) return;
  d.amount = before;
  d.status = 'pending';
  persist();
}

function getReceivables() { return DB.receivables; }
function totalReceivables() {
  return DB.receivables.filter(r => r.status === 'pending' && typeof r.amount === 'number').reduce((s, r) => s + r.amount, 0);
}
function findReceivableByPerson(name) {
  const norm = name.toLowerCase();
  return DB.receivables.filter(r => r.status === 'pending').find(r => r.name.toLowerCase().includes(norm));
}
function receiveIncome(receivableId, amount) {
  const r = DB.receivables.find(x => x.id === receivableId);
  const before = r ? r.amount : null;
  const beforeStatus = r ? r.status : null;
  DB.settings.cash += amount;
  if (r && typeof r.amount === 'number') {
    r.amount = Math.max(0, r.amount - amount);
    if (r.amount === 0) r.status = 'paid';
  }
  persist();
  return { receivable: r, before, beforeStatus, amount };
}
function undoIncome(receivableId, before, beforeStatus, amount) {
  DB.settings.cash -= amount;
  const r = DB.receivables.find(x => x.id === receivableId);
  if (r) { r.amount = before; r.status = beforeStatus; }
  persist();
}
function recordGenericIncome(amount) { DB.settings.cash += amount; persist(); }
function recordExpense(amount) { DB.settings.cash -= amount; persist(); }

/* ---------------- clients / pipeline / leads ---------------- */
function getClients() { return DB.clients; }
function createClient(fields) {
  const client = { id: uid('c'), name: fields.name, status: fields.status || 'prospect', tag: fields.tag || 'WARM' };
  DB.clients.unshift(client);
  persist();
  return client;
}
function findClient(name) {
  const norm = name.toLowerCase();
  return DB.clients.find(c => c.name.toLowerCase() === norm);
}
function getPipeline() { return DB.pipeline; }
function getLeads() { return DB.leads; }

/* ---------------- Fifth & Zero ---------------- */
function getFifthZero() { return DB.fifthZero.slice().sort((a, b) => a.priority - b.priority); }
function updateFifthZero(id, patch) {
  const f = DB.fifthZero.find(x => x.id === id);
  if (!f) return null;
  Object.assign(f, patch);
  persist();
  return f;
}

/* ---------------- inbox (ambiguous captures) ---------------- */
function getInbox() { return DB.inbox; }
function addToInbox(item) {
  const record = { id: uid('ib'), ...item, created_at: nowIso() };
  DB.inbox.unshift(record);
  persist();
  return record;
}
function removeFromInbox(id) { DB.inbox = DB.inbox.filter(i => i.id !== id); persist(); }

/* ---------------- global search ---------------- */
function globalSearch(query) {
  const q = query.trim().toLowerCase();
  if (!q) return { tasks: [], ideas: [], notes: [], clients: [], pipeline: [], activity: [] };
  const hit = s => (s || '').toLowerCase().includes(q);
  return {
    tasks: DB.tasks.filter(t => hit(t.title) || hit(t.client) || hit(t.project) || hit(t.category)),
    ideas: DB.ideas.filter(i => hit(i.text) || hit(i.client) || hit(i.project)),
    notes: DB.notes.filter(n => hit(n.text) || hit(n.client) || hit(n.project)),
    clients: DB.clients.filter(c => hit(c.name)),
    pipeline: DB.pipeline.filter(p => hit(p.client) || hit(p.description)),
    activity: DB.activityLog.filter(a => hit(a.input) || hit(a.action) || hit(a.result)),
  };
}

/* ---------------- derived / dashboard ---------------- */
function getMoneySummary() {
  return {
    cash: DB.settings.cash,
    receivables: totalReceivables(),
    debt: totalDebt(),
    burn: DB.settings.monthlyBurn,
  };
}
function getTodayPriorities(limit) {
  const rank = { P1: 0, P2: 1, P3: 2, P4: 3 };
  return DB.tasks
    .filter(t => t.status !== 'Completed' && t.status !== 'Cancelled')
    .sort((a, b) => (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9))
    .slice(0, limit || 5);
}
function resetDatabase() { DB = seedDatabase(); persist(); }

const NoelData = {
  getTasks, createTask, updateTask, deleteTask, findSimilarTask,
  getIdeas, createIdea, updateIdea, deleteIdea,
  getNotes, createNote, updateNote, deleteNote,
  getSettings, updateSettings,
  getDebts, getRecurringCommitments, totalDebt, findDebtByPerson, payDebt, undoDebtPayment,
  getReceivables, totalReceivables, findReceivableByPerson, receiveIncome, undoIncome,
  recordGenericIncome, recordExpense,
  getClients, createClient, findClient, getPipeline, getLeads,
  getFifthZero, updateFifthZero,
  getInbox, addToInbox, removeFromInbox,
  globalSearch, getMoneySummary, getTodayPriorities,
  logActivity, getActivityLog,
  resetDatabase,
  uid, nowIso, addDays, isoDateOnly, formatINR,
};
