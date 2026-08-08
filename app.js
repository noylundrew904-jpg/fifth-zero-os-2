/* ============================================================
   NOEL OS — UI layer (router + pages + capture pipeline)
   ============================================================ */

const NAV = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'tasks', label: 'Tasks', icon: '☑' },
  { id: 'money', label: 'Money', icon: '₹' },
  { id: 'clients', label: 'Clients', icon: '◐' },
  { id: 'pipeline', label: 'Pipeline', icon: '⬈' },
  { id: 'fifthzero', label: 'Fifth & Zero', icon: '✦' },
  { id: 'ideas', label: 'Ideas', icon: '💡' },
  { id: 'notes', label: 'Notes', icon: '📝' },
  { id: 'memory', label: 'Memory', icon: '⧉' },
  { id: 'calendar', label: 'Calendar', icon: '▤' },
  { id: 'assistant', label: 'Assistant', icon: '✳' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];
const MOBILE_NAV_IDS = ['home', 'tasks', 'money', 'assistant'];

let currentScreen = 'home';
let moneyTab = 'overview';
let taskFilter = 'active';
let ideaFilter = 'all';
const UNDO_HANDLERS = new Map();
const chatLog = [];

const root = () => document.getElementById('pageRoot');
function escapeHtml(s) { return (s ?? '').toString().replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function pageHeader(title, desc, actionHtml) {
  return `<div class="page-header"><div><div class="page-title">${title}</div><div class="page-desc">${desc}</div></div>${actionHtml || ''}</div>`;
}
function priorityBadge(p) { return `<span class="badge badge-${(p || 'p4').toLowerCase()}">${p}</span>`; }

/* ---------------- toast ---------------- */
function showToast(message, opts) {
  const stack = document.getElementById('toastStack');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span style="flex:1;">${escapeHtml(message)}</span>${opts && opts.undoId ? `<button class="toast-undo" data-undo="${opts.undoId}">Undo</button>` : ''}`;
  stack.appendChild(el);
  if (opts && opts.undoId) {
    el.querySelector('[data-undo]').addEventListener('click', () => {
      const fn = UNDO_HANDLERS.get(opts.undoId);
      if (fn) { fn(); UNDO_HANDLERS.delete(opts.undoId); showToast('Undone.'); renderCurrentScreen(); }
      el.remove();
    });
  }
  setTimeout(() => el.remove(), 6000);
}

/* ---------------- router ---------------- */
function renderNav() {
  const el = document.getElementById('navList');
  el.innerHTML = NAV.map(n => `<button class="nav-item ${currentScreen === n.id ? 'active' : ''}" data-nav="${n.id}"><span>${n.icon}</span> ${n.label}</button>`).join('');
  el.querySelectorAll('[data-nav]').forEach(b => b.addEventListener('click', () => goScreen(b.dataset.nav)));

  document.querySelectorAll('.bottom-nav-item[data-nav]').forEach(b => {
    b.classList.toggle('active', b.dataset.nav === currentScreen);
  });
}
function goScreen(id) {
  currentScreen = id;
  document.getElementById('topbarTitle').textContent = (NAV.find(n => n.id === id) || {}).label || 'NOEL OS';
  renderNav();
  RENDERERS[id]();
  document.getElementById('pageRoot').scrollTop = 0;
}
function renderCurrentScreen() { RENDERERS[currentScreen](); }

/* ============================================================
   HOME
   ============================================================ */
function greetingWord() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
function renderHome() {
  const settings = NoelData.getSettings();
  const top = NoelData.getTodayPriorities(3);
  const money = NoelData.getMoneySummary();
  const pipeline = NoelData.getPipeline();
  const fz = NoelData.getFifthZero();
  const ideas = NoelData.getIdeas().slice(0, 3);
  const notes = NoelData.getNotes().slice(0, 3);
  const activity = NoelData.getActivityLog(5);
  const importantCount = top.filter(t => t.priority === 'P1' || t.priority === 'P2').length;
  const dot = { red: 'red', yellow: 'yellow', green: 'green' };

  root().innerHTML = `
    <div class="greeting">${greetingWord()}, ${escapeHtml(settings.name)}.</div>
    <div class="greeting-date">${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
    <div class="greeting-status">${importantCount > 0 ? `You have ${importantCount} important thing${importantCount > 1 ? 's' : ''} today` : 'Nothing urgent — good day to create'}</div>

    <form class="form-card" id="universalCaptureForm" style="margin-top:24px;display:flex;gap:8px;align-items:center;">
      <input id="universalCaptureInput" class="capture-input" placeholder="Tell NOEL OS something — “Paid Clyde ₹5,000”, “Idea for Fifth &amp; Zero…”, “What should I do today?”" />
      <button class="btn btn-primary" type="submit">Capture</button>
    </form>

    <div class="section-title">Today<button class="linklike" data-nav-to="tasks">All tasks →</button></div>
    <div id="homeTasks"></div>

    <div class="section-title">Money<button class="linklike" data-nav-to="money">Details →</button></div>
    <div class="grid grid-4">
      <div class="card"><div class="card-sub">Cash</div><div class="card-value">${NoelData.formatINR(money.cash)}</div></div>
      <div class="card"><div class="card-sub">Receivables</div><div class="card-value">${NoelData.formatINR(money.receivables)}</div></div>
      <div class="card"><div class="card-sub">Debt</div><div class="card-value" style="color:var(--p1);">${NoelData.formatINR(money.debt)}</div></div>
      <div class="card"><div class="card-sub">Monthly burn</div><div class="card-value">${NoelData.formatINR(money.burn)}</div></div>
    </div>

    <div class="section-title">Pipeline<button class="linklike" data-nav-to="pipeline">All →</button></div>
    <div id="homePipeline"></div>

    <div class="section-title">Fifth &amp; Zero<button class="linklike" data-nav-to="fifthzero">Board →</button></div>
    <div class="grid grid-4" id="homeFz"></div>

    <div class="section-title">Ideas<button class="linklike" data-nav-to="ideas">All →</button></div>
    <div id="homeIdeas"></div>

    <div class="section-title">Notes<button class="linklike" data-nav-to="notes">All →</button></div>
    <div id="homeNotes"></div>

    <div class="section-title">Activity</div>
    <div id="homeActivity"></div>
  `;

  document.getElementById('homeTasks').innerHTML = top.length ? top.map(taskRow).join('') :
    `<div class="empty"><div class="empty-title">Nothing urgent today.</div>Capture a task above and it'll show up here.</div>`;
  wireTaskRowEvents(document.getElementById('homeTasks'));

  document.getElementById('homePipeline').innerHTML = pipeline.length ? pipeline.map(pipelineRow).join('') :
    `<div class="empty">Your pipeline is quiet. Good time to create.</div>`;

  document.getElementById('homeFz').innerHTML = fz.map(f => `
    <div class="card fz-card"><div><div class="card-title">${escapeHtml(f.name)}</div></div><span class="fz-dot ${dot[f.status]}"></span></div>
  `).join('');

  document.getElementById('homeIdeas').innerHTML = ideas.length ? ideas.map(ideaRow).join('') : `<div class="empty">No ideas captured yet.</div>`;
  wireIdeaRowEvents(document.getElementById('homeIdeas'));

  document.getElementById('homeNotes').innerHTML = notes.length ? notes.map(noteRow).join('') : `<div class="empty">No notes captured yet.</div>`;

  document.getElementById('homeActivity').innerHTML = activity.length ? activity.map(activityRow).join('') : `<div class="empty">Nothing logged yet.</div>`;
  wireActivityRowEvents(document.getElementById('homeActivity'));

  root().querySelectorAll('[data-nav-to]').forEach(b => b.addEventListener('click', () => goScreen(b.dataset.navTo)));
  document.getElementById('universalCaptureForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('universalCaptureInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    handleUniversalInput(text);
  });
}

/* ============================================================
   ROW RENDERERS (shared)
   ============================================================ */
function taskRow(t) {
  const meta = [t.category, t.client, t.project, t.due_date].filter(Boolean).join(' · ');
  const done = t.status === 'Completed';
  return `<div class="list-item" data-task="${t.id}">
    <button class="checkbox ${done ? 'checked' : ''}" data-toggle="${t.id}">${done ? '✓' : ''}</button>
    <div class="list-item-main">
      <div class="task-title ${done ? 'done' : ''}">${escapeHtml(t.title)}</div>
      ${meta ? `<div class="task-meta">${escapeHtml(meta)}</div>` : ''}
    </div>
    <select class="priority-select" data-priority="${t.id}">
      ${['P1', 'P2', 'P3', 'P4'].map(p => `<option value="${p}" ${p === t.priority ? 'selected' : ''}>${p}</option>`).join('')}
    </select>
    <button class="icon-btn" data-del-task="${t.id}" title="Delete">✕</button>
  </div>`;
}
function wireTaskRowEvents(container) {
  container.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => {
    const t = NoelData.getTasks().find(x => x.id === b.dataset.toggle);
    NoelData.updateTask(t.id, { status: t.status === 'Completed' ? 'Not Started' : 'Completed' });
    renderCurrentScreen();
  }));
  container.querySelectorAll('[data-priority]').forEach(s => s.addEventListener('change', () => {
    NoelData.updateTask(s.dataset.priority, { priority: s.value });
    renderCurrentScreen();
  }));
  container.querySelectorAll('[data-del-task]').forEach(b => b.addEventListener('click', () => {
    NoelData.deleteTask(b.dataset.delTask);
    renderCurrentScreen();
  }));
}

function ideaRow(i) {
  const badge = { HOT: ['🔥 Hot', 'badge-p1'], INTERESTING: ['⭐ Interesting', 'badge-p2'], SOMEDAY: ['💭 Someday', 'badge-muted'] }[i.priority] || ['💭', 'badge-muted'];
  return `<div class="list-item">
    <div class="list-item-main">
      <div class="task-title">${escapeHtml(i.text)}</div>
      <div class="task-meta">${[i.category, i.project, i.client].filter(Boolean).map(escapeHtml).join(' · ')}</div>
    </div>
    <span class="badge ${badge[1]}">${badge[0]}</span>
    <button class="btn btn-ghost btn-sm" data-idea-to-task="${i.id}">Turn into task</button>
    <button class="icon-btn" data-del-idea="${i.id}" title="Delete">✕</button>
  </div>`;
}
function wireIdeaRowEvents(container) {
  container.querySelectorAll('[data-idea-to-task]').forEach(b => b.addEventListener('click', () => {
    const idea = NoelData.getIdeas().find(x => x.id === b.dataset.ideaToTask);
    NoelData.createTask({ title: idea.text, category: idea.category === 'Fifth & Zero' ? 'Fifth & Zero' : 'Creative', project: idea.project, client: idea.client, priority: 'P3', source: 'idea' });
    NoelData.updateIdea(idea.id, { status: 'Developing' });
    NoelData.logActivity({ input: idea.text, action: 'Idea turned into task', result: `"${idea.text}" added to Tasks.` });
    showToast('Turned into a task.');
    renderCurrentScreen();
  }));
  container.querySelectorAll('[data-del-idea]').forEach(b => b.addEventListener('click', () => { NoelData.deleteIdea(b.dataset.delIdea); renderCurrentScreen(); }));
}

function noteRow(n) {
  return `<div class="list-item">
    <div class="list-item-main">
      <div class="task-title">${escapeHtml(n.text)}</div>
      <div class="task-meta">${[n.category, n.client, n.project].filter(Boolean).map(escapeHtml).join(' · ')}</div>
    </div>
    <button class="icon-btn" data-del-note="${n.id}" title="Delete">✕</button>
  </div>`;
}
function wireNoteRowEvents(container) {
  container.querySelectorAll('[data-del-note]').forEach(b => b.addEventListener('click', () => { NoelData.deleteNote(b.dataset.delNote); renderCurrentScreen(); }));
}

function pipelineRow(p) {
  const amt = p.amount ? NoelData.formatINR(p.amount) + (p.recurring ? ` + ${NoelData.formatINR(p.recurring)}/mo` : '') : `${NoelData.formatINR(p.amountLow)}–${NoelData.formatINR(p.amountHigh)}`;
  const stageClass = { 'IN TALKS': 'badge-p2', FORECAST: 'badge-p3', POTENTIAL: 'badge-muted', CONFIRMED: 'badge-good', RECEIVABLE: 'badge-accent', PAID: 'badge-good' }[p.stage] || 'badge-muted';
  return `<div class="list-item">
    <div class="list-item-main"><div class="task-title">${escapeHtml(p.client)} — ${escapeHtml(p.description)}</div><div class="task-meta">${amt}</div></div>
    <span class="badge ${stageClass}">${p.stage}</span>
  </div>`;
}

function activityRow(a) {
  const canUndo = UNDO_HANDLERS.has(a.id);
  const time = new Date(a.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  return `<div class="list-item" style="align-items:flex-start;">
    <div class="list-item-main">
      ${a.input ? `<div class="task-meta">${time} · “${escapeHtml(a.input)}”</div>` : `<div class="task-meta">${time}</div>`}
      <div class="task-title">${escapeHtml(a.action)}</div>
      <div class="task-meta">${escapeHtml(a.result || '')}</div>
    </div>
    ${canUndo ? `<button class="btn btn-ghost btn-sm" data-undo-activity="${a.id}">Undo</button>` : ''}
  </div>`;
}
function wireActivityRowEvents(container) {
  container.querySelectorAll('[data-undo-activity]').forEach(b => b.addEventListener('click', () => {
    const fn = UNDO_HANDLERS.get(b.dataset.undoActivity);
    if (fn) { fn(); UNDO_HANDLERS.delete(b.dataset.undoActivity); showToast('Undone.'); renderCurrentScreen(); }
  }));
}

/* ============================================================
   TASKS PAGE
   ============================================================ */
const TASK_FILTERS = ['active', 'completed', 'all'];
function renderTasks() {
  const all = NoelData.getTasks();
  const filtered = taskFilter === 'active' ? all.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled')
    : taskFilter === 'completed' ? all.filter(t => t.status === 'Completed') : all;
  const rank = { P1: 0, P2: 1, P3: 2, P4: 3 };
  filtered.sort((a, b) => (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9));

  root().innerHTML = `
    ${pageHeader('Tasks', 'Everything that needs doing, organised for you', `<button class="btn btn-primary" id="newTaskBtn">+ New task</button>`)}
    <div class="tab-row">${TASK_FILTERS.map(f => `<button class="tab-btn ${f === taskFilter ? 'active' : ''}" data-tfilter="${f}">${f}</button>`).join('')}</div>
    <div id="taskForm"></div>
    <div id="taskList"></div>`;

  document.querySelectorAll('[data-tfilter]').forEach(b => b.addEventListener('click', () => { taskFilter = b.dataset.tfilter; renderTasks(); }));
  document.getElementById('newTaskBtn').addEventListener('click', () => showTaskForm());

  const listEl = document.getElementById('taskList');
  listEl.innerHTML = filtered.length ? filtered.map(taskRow).join('') : `<div class="empty"><div class="empty-title">Nothing here.</div>Capture a task from Home or add one directly.</div>`;
  wireTaskRowEvents(listEl);
}
function showTaskForm() {
  document.getElementById('taskForm').innerHTML = `
    <form class="form-card" id="tForm">
      <div class="field"><label>Title</label><input id="tTitle" required /></div>
      <div class="form-row">
        <div class="field"><label>Category</label><select id="tCategory">
          ${['Client Work', 'Sales', 'Fifth & Zero', 'Admin', 'Finance', 'Content', 'Video', 'Design', 'Writing', 'Learning', 'Personal', 'Health', 'Home', 'Errands', 'Email', 'Calls', 'Follow-ups', 'Documents', 'Payments'].map(c => `<option>${c}</option>`).join('')}
        </select></div>
        <div class="field"><label>Priority</label><select id="tPriority"><option>P1</option><option>P2</option><option selected>P3</option><option>P4</option></select></div>
      </div>
      <div class="form-row">
        <div class="field"><label>Client</label><input id="tClient" /></div>
        <div class="field"><label>Due date</label><input type="date" id="tDue" /></div>
      </div>
      <div style="display:flex;gap:8px;"><button class="btn btn-primary">Add task</button><button type="button" class="btn btn-ghost" id="tCancel">Cancel</button></div>
    </form>`;
  document.getElementById('tCancel').addEventListener('click', () => { document.getElementById('taskForm').innerHTML = ''; });
  document.getElementById('tForm').addEventListener('submit', (e) => {
    e.preventDefault();
    NoelData.createTask({
      title: document.getElementById('tTitle').value, category: document.getElementById('tCategory').value,
      priority: document.getElementById('tPriority').value, client: document.getElementById('tClient').value || null,
      due_date: document.getElementById('tDue').value || null, source: 'manual',
    });
    document.getElementById('taskForm').innerHTML = '';
    renderTasks();
  });
}

/* ============================================================
   IDEAS PAGE
   ============================================================ */
const IDEA_FILTERS = [['all', 'All'], ['HOT', '🔥 Hot'], ['INTERESTING', '⭐ Interesting'], ['SOMEDAY', '💭 Someday']];
function renderIdeas() {
  const all = NoelData.getIdeas();
  const filtered = ideaFilter === 'all' ? all : all.filter(i => i.priority === ideaFilter);
  root().innerHTML = `
    ${pageHeader('Ideas', 'Worth developing — not yet a task', `<button class="btn btn-primary" id="newIdeaBtn">+ New idea</button>`)}
    <div class="tab-row">${IDEA_FILTERS.map(([id, label]) => `<button class="tab-btn ${id === ideaFilter ? 'active' : ''}" data-ifilter="${id}">${label}</button>`).join('')}</div>
    <div id="ideaForm"></div>
    <div id="ideaList">${filtered.length ? filtered.map(ideaRow).join('') : `<div class="empty">No ideas here yet.</div>`}</div>`;
  document.querySelectorAll('[data-ifilter]').forEach(b => b.addEventListener('click', () => { ideaFilter = b.dataset.ifilter; renderIdeas(); }));
  wireIdeaRowEvents(document.getElementById('ideaList'));
  document.getElementById('newIdeaBtn').addEventListener('click', () => {
    document.getElementById('ideaForm').innerHTML = `
      <form class="form-card" id="iForm">
        <div class="field"><label>Idea</label><textarea id="iText" rows="2" required></textarea></div>
        <div class="form-row">
          <div class="field"><label>Category</label><select id="iCategory">${['Creative', 'Business', 'Fifth & Zero', 'Content', 'Campaign', 'Client', 'Product', 'AI', 'Personal', 'Learning'].map(c => `<option>${c}</option>`).join('')}</select></div>
          <div class="field"><label>Priority</label><select id="iPriority"><option value="HOT">🔥 Hot</option><option value="INTERESTING" selected>⭐ Interesting</option><option value="SOMEDAY">💭 Someday</option></select></div>
        </div>
        <div style="display:flex;gap:8px;"><button class="btn btn-primary">Save idea</button><button type="button" class="btn btn-ghost" id="iCancel">Cancel</button></div>
      </form>`;
    document.getElementById('iCancel').addEventListener('click', () => { document.getElementById('ideaForm').innerHTML = ''; });
    document.getElementById('iForm').addEventListener('submit', (e) => {
      e.preventDefault();
      NoelData.createIdea({ text: document.getElementById('iText').value, category: document.getElementById('iCategory').value, priority: document.getElementById('iPriority').value, source: 'manual' });
      document.getElementById('ideaForm').innerHTML = '';
      renderIdeas();
    });
  });
}

/* ============================================================
   NOTES PAGE
   ============================================================ */
function renderNotes() {
  const all = NoelData.getNotes();
  root().innerHTML = `
    ${pageHeader('Notes', 'Worth remembering — no action needed', `<button class="btn btn-primary" id="newNoteBtn">+ New note</button>`)}
    <div id="noteForm"></div>
    <div id="noteList">${all.length ? all.map(noteRow).join('') : `<div class="empty">No notes yet.</div>`}</div>`;
  wireNoteRowEvents(document.getElementById('noteList'));
  document.getElementById('newNoteBtn').addEventListener('click', () => {
    document.getElementById('noteForm').innerHTML = `
      <form class="form-card" id="nForm">
        <div class="field"><label>Note</label><textarea id="nText" rows="2" required></textarea></div>
        <div class="form-row">
          <div class="field"><label>Category</label><select id="nCategory">${['Personal', 'Client', 'Business', 'Fifth & Zero', 'Creative', 'Learning', 'Meeting', 'Reference', 'Finance'].map(c => `<option>${c}</option>`).join('')}</select></div>
          <div class="field"><label>Client (optional)</label><input id="nClient" /></div>
        </div>
        <div style="display:flex;gap:8px;"><button class="btn btn-primary">Save note</button><button type="button" class="btn btn-ghost" id="nCancel">Cancel</button></div>
      </form>`;
    document.getElementById('nCancel').addEventListener('click', () => { document.getElementById('noteForm').innerHTML = ''; });
    document.getElementById('nForm').addEventListener('submit', (e) => {
      e.preventDefault();
      NoelData.createNote({ text: document.getElementById('nText').value, category: document.getElementById('nCategory').value, client: document.getElementById('nClient').value || null, source: 'manual' });
      document.getElementById('noteForm').innerHTML = '';
      renderNotes();
    });
  });
}

/* ============================================================
   MONEY PAGE (overview / debt / receivables)
   ============================================================ */
function renderMoney() {
  const money = NoelData.getMoneySummary();
  root().innerHTML = `
    ${pageHeader('Money', 'Where things actually stand', '')}
    <div class="tab-row">
      ${[['overview', 'Overview'], ['debt', 'Debt'], ['receivables', 'Receivables']].map(([id, l]) => `<button class="tab-btn ${id === moneyTab ? 'active' : ''}" data-mtab="${id}">${l}</button>`).join('')}
    </div>
    <div id="moneyBody"></div>`;
  document.querySelectorAll('[data-mtab]').forEach(b => b.addEventListener('click', () => { moneyTab = b.dataset.mtab; renderMoney(); }));

  const body = document.getElementById('moneyBody');
  if (moneyTab === 'overview') {
    body.innerHTML = `
      <div class="grid grid-4">
        <div class="card"><div class="card-sub">Cash</div><div class="card-value">${NoelData.formatINR(money.cash)}</div></div>
        <div class="card"><div class="card-sub">Receivables</div><div class="card-value">${NoelData.formatINR(money.receivables)}</div></div>
        <div class="card"><div class="card-sub">Debt</div><div class="card-value" style="color:var(--p1);">${NoelData.formatINR(money.debt)}</div></div>
        <div class="card"><div class="card-sub">Monthly burn</div><div class="card-value">${NoelData.formatINR(money.burn)}</div></div>
      </div>
      <div class="section-title">Quick capture</div>
      <form class="form-card" id="moneyQuickForm">
        <div class="form-row">
          <div class="field"><label>Type</label><select id="mqType"><option value="expense">Expense</option><option value="income">Income</option></select></div>
          <div class="field"><label>Amount (₹)</label><input type="number" id="mqAmount" required /></div>
        </div>
        <div class="field"><label>Category / from</label><input id="mqNote" placeholder="e.g. Food, or Azeem" /></div>
        <button class="btn btn-primary">Save</button>
      </form>`;
    document.getElementById('moneyQuickForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const type = document.getElementById('mqType').value;
      const amount = Number(document.getElementById('mqAmount').value);
      const note = document.getElementById('mqNote').value;
      if (type === 'expense') {
        NoelData.recordExpense(amount);
        NoelData.logActivity({ input: null, action: `Expense recorded: ${NoelData.formatINR(amount)}${note ? ' — ' + note : ''}`, result: 'Cash updated.' });
      } else {
        NoelData.recordGenericIncome(amount);
        NoelData.logActivity({ input: null, action: `Income recorded: ${NoelData.formatINR(amount)}${note ? ' — ' + note : ''}`, result: 'Cash updated.' });
      }
      showToast('Saved.');
      renderMoney();
    });
  } else if (moneyTab === 'debt') {
    const debts = NoelData.getDebts();
    const recurring = NoelData.getRecurringCommitments();
    body.innerHTML = `
      <div class="card" style="margin-bottom:16px;"><div class="card-sub">Total remaining debt</div><div class="card-value" style="color:var(--p1);">${NoelData.formatINR(NoelData.totalDebt())}</div></div>
      <div class="section-title">Priority order</div>
      <div id="debtList">${debts.map(debtRow).join('')}</div>
      <div class="section-title">Recurring commitments</div>
      <div class="grid grid-2">${recurring.map(r => `
        <div class="card"><div class="card-title">${escapeHtml(r.name)}</div><div class="card-sub">${NoelData.formatINR(r.amount)}/month · ${r.remainingMonths} of ${r.termMonths} months remaining</div></div>
      `).join('')}</div>`;
    document.querySelectorAll('[data-pay-debt]').forEach(b => b.addEventListener('click', () => {
      const debt = debts.find(d => d.id === b.dataset.payDebt);
      const amountStr = prompt(`Amount paid toward ${debt.person || debt.name}?`, debt.amount);
      const amount = Number(amountStr);
      if (!amountStr || isNaN(amount) || amount <= 0) return;
      applyAction({ type: 'Debt Payment', fields: { person: debt.person || debt.name, debtId: debt.id, amount }, raw: null });
      renderMoney();
    }));
  } else {
    const rec = NoelData.getReceivables();
    body.innerHTML = `
      <div class="card" style="margin-bottom:16px;"><div class="card-sub">Total expected</div><div class="card-value">${NoelData.formatINR(NoelData.totalReceivables())}</div></div>
      <div id="recList">${rec.map(receivableRow).join('')}</div>`;
    document.querySelectorAll('[data-receive]').forEach(b => b.addEventListener('click', () => {
      const r = rec.find(x => x.id === b.dataset.receive);
      const amountStr = prompt(`Amount received from ${r.name}?`, r.amount ?? '');
      const amount = Number(amountStr);
      if (!amountStr || isNaN(amount) || amount <= 0) return;
      applyAction({ type: 'Income', fields: { person: r.name, receivableId: r.id, amount }, raw: null });
      renderMoney();
    }));
  }
}
function debtRow(d, idx) {
  const paid = d.status === 'paid';
  return `<div class="debt-item">
    <div style="display:flex;align-items:center;gap:10px;">
      <span class="debt-rank">${idx + 1}</span>
      <div><div class="card-title" style="${paid ? 'text-decoration:line-through;color:var(--muted);' : ''}">${escapeHtml(d.person || d.name)}</div></div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;">
      <span>${paid ? '' : NoelData.formatINR(d.amount)}</span>
      ${paid ? `<span class="badge badge-good">PAID</span>` : `<button class="btn btn-ghost btn-sm" data-pay-debt="${d.id}">Pay</button>`}
    </div>
  </div>`;
}
function receivableRow(r) {
  const paid = r.status === 'paid';
  const tbd = r.status === 'tbd';
  return `<div class="debt-item">
    <div class="card-title">${escapeHtml(r.name)}</div>
    <div style="display:flex;align-items:center;gap:10px;">
      <span>${tbd ? 'TBD' : NoelData.formatINR(r.amount)}</span>
      ${paid ? `<span class="badge badge-good">RECEIVED</span>` : tbd ? '' : `<button class="btn btn-ghost btn-sm" data-receive="${r.id}">Received</button>`}
    </div>
  </div>`;
}

/* ============================================================
   PIPELINE PAGE
   ============================================================ */
function renderPipeline() {
  const pipeline = NoelData.getPipeline();
  const leads = NoelData.getLeads();
  root().innerHTML = `
    ${pageHeader('Pipeline', 'Sales, honestly labelled', '')}
    <div id="pipelineList">${pipeline.length ? pipeline.map(pipelineRow).join('') : `<div class="empty">Your pipeline is quiet. Good time to create.</div>`}</div>
    <div class="section-title">Leads</div>
    <div id="leadsList">${leads.map(l => `<div class="list-item"><div class="list-item-main">${escapeHtml(l.name)}</div></div>`).join('')}</div>`;
}

/* ============================================================
   FIFTH & ZERO PAGE
   ============================================================ */
function renderFifthZero() {
  const fz = NoelData.getFifthZero();
  const tasks = NoelData.getTasks().filter(t => t.category === 'Fifth & Zero');
  const ideas = NoelData.getIdeas().filter(i => i.category === 'Fifth & Zero');
  root().innerHTML = `
    ${pageHeader('Fifth & Zero', 'The studio, tracked in one place', '')}
    <div class="grid grid-2" id="fzBoard"></div>
    <div class="section-title">Related tasks</div>
    <div id="fzTasks">${tasks.length ? tasks.map(taskRow).join('') : `<div class="empty">No Fifth & Zero tasks yet.</div>`}</div>
    <div class="section-title">Related ideas</div>
    <div id="fzIdeas">${ideas.length ? ideas.map(ideaRow).join('') : `<div class="empty">No Fifth & Zero ideas yet.</div>`}</div>`;
  wireTaskRowEvents(document.getElementById('fzTasks'));
  wireIdeaRowEvents(document.getElementById('fzIdeas'));

  document.getElementById('fzBoard').innerHTML = fz.map(f => `
    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div class="card-title">${f.priority}. ${escapeHtml(f.name)}</div>
        <button class="fz-dot ${f.status}" data-cycle-fz="${f.id}" title="Click to change status" style="cursor:pointer;border:none;"></button>
      </div>
      <div class="card-sub" style="margin-top:6px;">${f.deadline ? 'Deadline ' + f.deadline : 'No deadline set'}</div>
    </div>`).join('');
  document.querySelectorAll('[data-cycle-fz]').forEach(b => b.addEventListener('click', () => {
    const order = ['red', 'yellow', 'green'];
    const f = fz.find(x => x.id === b.dataset.cycleFz);
    const next = order[(order.indexOf(f.status) + 1) % order.length];
    NoelData.updateFifthZero(f.id, { status: next });
    renderFifthZero();
  }));
}

/* ============================================================
   CLIENTS PAGE
   ============================================================ */
function renderClients() {
  const clients = NoelData.getClients();
  root().innerHTML = `
    ${pageHeader('Clients', 'Every relationship that generates work', `<button class="btn btn-primary" id="newClientBtn">+ New client</button>`)}
    <div id="clientForm"></div>
    <div id="clientList">${clients.length ? clients.map(c => `
      <div class="list-item"><div class="list-item-main"><div class="task-title">${escapeHtml(c.name)}</div><div class="task-meta">${c.status}</div></div><span class="badge badge-${c.tag === 'HOT' ? 'p1' : c.tag === 'WARM' ? 'p2' : 'muted'}">${c.tag}</span></div>
    `).join('') : `<div class="empty">No clients yet.</div>`}</div>`;
  document.getElementById('newClientBtn').addEventListener('click', () => {
    document.getElementById('clientForm').innerHTML = `
      <form class="form-card" id="cForm">
        <div class="form-row">
          <div class="field"><label>Name</label><input id="cName" required /></div>
          <div class="field"><label>Tag</label><select id="cTag"><option>HOT</option><option>WARM</option><option>COOL</option></select></div>
        </div>
        <div style="display:flex;gap:8px;"><button class="btn btn-primary">Add</button><button type="button" class="btn btn-ghost" id="cCancel">Cancel</button></div>
      </form>`;
    document.getElementById('cCancel').addEventListener('click', () => { document.getElementById('clientForm').innerHTML = ''; });
    document.getElementById('cForm').addEventListener('submit', (e) => {
      e.preventDefault();
      NoelData.createClient({ name: document.getElementById('cName').value, tag: document.getElementById('cTag').value });
      document.getElementById('clientForm').innerHTML = '';
      renderClients();
    });
  });
}

/* ============================================================
   MEMORY PAGE
   ============================================================ */
const MEMORY_DOCS = ['01 — Personal Context', '02 — Fifth & Zero', '03 — Business Strategy', '04 — Client Context', '05 — Decisions', '06 — Ideas', '07 — SOPs', '08 — Important Conversations'];
function renderMemory() {
  const notes = NoelData.getNotes();
  root().innerHTML = `
    ${pageHeader('Memory', 'Permanent context, current state, and history', '')}
    <div class="card" style="margin-bottom:20px;">
      <div class="card-title">Google Docs memory — not connected</div>
      <div class="card-sub" style="margin-top:4px;">In Phase 4 these become real Google Docs. Until then, notes captured here are your memory, stored locally.</div>
    </div>
    <div class="grid grid-2">${MEMORY_DOCS.map(d => `<div class="card"><div class="card-title">${d}</div><span class="badge badge-muted" style="margin-top:8px;display:inline-flex;">Not connected</span></div>`).join('')}</div>
    <div class="section-title">Notes (local memory)</div>
    <div id="memoryNotes">${notes.length ? notes.map(noteRow).join('') : `<div class="empty">Nothing remembered yet.</div>`}</div>`;
  wireNoteRowEvents(document.getElementById('memoryNotes'));
}

/* ============================================================
   CALENDAR PAGE
   ============================================================ */
function renderCalendar() {
  const withDates = NoelData.getTasks().filter(t => t.due_date && t.status !== 'Completed').sort((a, b) => a.due_date.localeCompare(b.due_date));
  root().innerHTML = `
    ${pageHeader('Calendar', 'Agenda view of what you owe your time', '')}
    <div class="card" style="margin-bottom:20px;">
      <div class="card-title">Google Calendar — not connected</div>
      <div class="card-sub" style="margin-top:4px;">Coming in Phase 8. This agenda is built from task due dates in the meantime.</div>
    </div>
    <div id="calList">${withDates.length ? withDates.map(taskRow).join('') : `<div class="empty">Nothing scheduled.</div>`}</div>`;
  wireTaskRowEvents(document.getElementById('calList'));
}

/* ============================================================
   ASSISTANT PAGE
   ============================================================ */
const CHAT_SUGGESTIONS = ['What should I do today?', 'How much debt do I have?', 'When can I clear my debt?', 'What money am I expecting?', 'Who should I follow up with?', 'What do I know about Sonia?', 'Show all Fifth & Zero ideas.'];
function renderAssistant() {
  root().innerHTML = `
    ${pageHeader('Assistant', 'Answers from your real data — never guesses', '')}
    <div class="chat-suggestions" id="chatSuggestions">${CHAT_SUGGESTIONS.map(s => `<button class="chat-suggestion" data-suggest="${escapeHtml(s)}">${s}</button>`).join('')}</div>
    <div class="chat-window" id="chatWindow"></div>
    <form class="chat-input-row" id="chatForm">
      <input id="chatInput" placeholder="Ask NOEL OS anything about your data…" />
      <button class="btn btn-primary">Ask</button>
    </form>`;
  renderChatWindow();
  document.querySelectorAll('[data-suggest]').forEach(b => b.addEventListener('click', () => askAssistant(b.dataset.suggest)));
  document.getElementById('chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    askAssistant(text);
  });
}
function renderChatWindow() {
  const el = document.getElementById('chatWindow');
  if (!el) return;
  el.innerHTML = chatLog.length ? chatLog.map(m => `<div class="chat-bubble ${m.role}">${escapeHtml(m.text).replace(/\n/g, '<br/>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</div>`).join('')
    : `<div class="empty">Ask me anything — I only answer from what's actually in NOEL OS.</div>`;
  el.scrollTop = el.scrollHeight;
}
function askAssistant(text) {
  chatLog.push({ role: 'user', text });
  const answer = NoelAssistant.answerQuery(text);
  chatLog.push({ role: 'assistant', text: answer });
  if (currentScreen === 'assistant') renderChatWindow();
  else { goScreen('assistant'); }
}

/* ============================================================
   SETTINGS PAGE
   ============================================================ */
function renderSettings() {
  const settings = NoelData.getSettings();
  root().innerHTML = `
    ${pageHeader('Settings', 'How NOEL OS is wired', '')}
    <div class="section-title">Google Workspace</div>
    <div class="card"><div class="card-title">Not connected</div><div class="card-sub" style="margin-top:4px;">Sheets, Docs, Calendar and Gmail integrations arrive in Phases 2–4 and 8. Everything today runs on local storage in this browser so you can use the whole app immediately.</div></div>

    <div class="section-title">Capture</div>
    <div class="card">
      <label style="display:flex;align-items:center;gap:10px;font-size:12.5px;">
        <input type="checkbox" id="autoConfirmToggle" ${settings.autoConfirmLowRisk ? 'checked' : ''} />
        Auto-save low-risk captures (tasks, ideas, notes) without asking. Financial changes always ask.
      </label>
    </div>

    <div class="section-title">Data</div>
    <div class="card" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div><div class="card-title">Reset to demo data</div><div class="card-sub">Wipes local changes and restores the seeded example data.</div></div>
      <button class="btn btn-ghost" id="resetBtn">Reset</button>
    </div>

    <div class="section-title">Security</div>
    <div class="card"><div class="card-sub">No credentials are stored in this app. Google OAuth (Phase 2) will use short-lived tokens server-side; nothing financial is hardcoded — every number here is computed from your stored records.</div></div>

    <div class="section-title">About</div>
    <div class="card"><div class="card-sub">NOEL OS — Phase 1 (UI + deterministic capture + voice + local persistence). See README for the full phase roadmap.</div></div>
  `;
  document.getElementById('autoConfirmToggle').addEventListener('change', (e) => NoelData.updateSettings({ autoConfirmLowRisk: e.target.checked }));
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Reset NOEL OS to the seeded demo data? This clears anything you captured locally.')) {
      NoelData.resetDatabase();
      showToast('Reset to demo data.');
      goScreen('home');
    }
  });
}

/* ============================================================
   GLOBAL SEARCH
   ============================================================ */
function openSearch() {
  document.getElementById('searchModalBackdrop').classList.add('active');
  const input = document.getElementById('searchInput');
  input.value = '';
  document.getElementById('searchResults').innerHTML = '';
  setTimeout(() => input.focus(), 50);
}
function closeSearch() { document.getElementById('searchModalBackdrop').classList.remove('active'); }
function renderSearchResults(query) {
  const el = document.getElementById('searchResults');
  if (!query.trim()) { el.innerHTML = ''; return; }
  const r = NoelData.globalSearch(query);
  const groups = [
    ['Tasks', r.tasks.map(t => t.title)],
    ['Ideas', r.ideas.map(i => i.text)],
    ['Notes', r.notes.map(n => n.text)],
    ['Clients', r.clients.map(c => c.name)],
    ['Pipeline', r.pipeline.map(p => `${p.client} — ${p.description}`)],
    ['Activity', r.activity.map(a => a.action)],
  ].filter(([, items]) => items.length);
  el.innerHTML = groups.length ? groups.map(([label, items]) => `
    <div class="search-group-title">${label}</div>
    ${items.map(i => `<div class="list-item">${escapeHtml(i)}</div>`).join('')}
  `).join('') : `<div class="empty">Nothing found.</div>`;
}

/* ============================================================
   CAPTURE PIPELINE
   ============================================================ */
function isQuestion(text) {
  return /^(what|how|who|when|where|why|which|show|search|give me)\b/i.test(text.trim()) || /\?\s*$/.test(text.trim());
}
function handleUniversalInput(text) {
  if (isQuestion(text)) { askAssistant(text); return; }
  processCapture(text);
}

function actionSummary(a) {
  switch (a.type) {
    case 'Expense': return `${NoelData.formatINR(a.fields.amount)} — ${a.fields.category} expense`;
    case 'Income': return `${NoelData.formatINR(a.fields.amount)} — ${a.fields.person ? a.fields.person + ' payment received' : 'income received'}`;
    case 'Debt Payment': return `${NoelData.formatINR(a.fields.amount)} — paid toward ${a.fields.person}`;
    case 'Task': return `Task: ${a.fields.title}${a.fields.due_date ? ` (due ${a.fields.due_date})` : ''}`;
    case 'Idea': return `Idea: ${a.fields.text}`;
    case 'Note': return `Note: ${a.fields.text}`;
    default: return a.raw;
  }
}

function applyAction(action) {
  const undoId = NoelData.uid('u');
  let record;
  switch (action.type) {
    case 'Expense': {
      NoelData.recordExpense(action.fields.amount);
      record = NoelData.logActivity({ id: undoId, input: action.raw, action: `Expense recorded: ${NoelData.formatINR(action.fields.amount)} — ${action.fields.category}`, result: 'Cash updated.' });
      UNDO_HANDLERS.set(undoId, () => NoelData.recordGenericIncome(action.fields.amount));
      break;
    }
    case 'Income': {
      if (action.fields.receivableId) {
        const { before, beforeStatus } = NoelData.receiveIncome(action.fields.receivableId, action.fields.amount);
        UNDO_HANDLERS.set(undoId, () => NoelData.undoIncome(action.fields.receivableId, before, beforeStatus, action.fields.amount));
      } else {
        NoelData.recordGenericIncome(action.fields.amount);
        UNDO_HANDLERS.set(undoId, () => NoelData.recordExpense(action.fields.amount));
      }
      record = NoelData.logActivity({ id: undoId, input: action.raw, action: `Income received: ${NoelData.formatINR(action.fields.amount)}${action.fields.person ? ' from ' + action.fields.person : ''}`, result: 'Cash increased, receivable updated.' });
      break;
    }
    case 'Debt Payment': {
      const { before } = NoelData.payDebt(action.fields.debtId, action.fields.amount);
      UNDO_HANDLERS.set(undoId, () => NoelData.undoDebtPayment(action.fields.debtId, before));
      record = NoelData.logActivity({ id: undoId, input: action.raw, action: `Debt payment recorded: ${NoelData.formatINR(action.fields.amount)} to ${action.fields.person}`, result: `${action.fields.person} balance updated.` });
      break;
    }
    case 'Task': {
      const task = NoelData.createTask({ ...action.fields, source: action.raw ? 'voice' : 'manual' });
      UNDO_HANDLERS.set(undoId, () => NoelData.deleteTask(task.id));
      record = NoelData.logActivity({ id: undoId, input: action.raw, action: `Task created: ${task.title}`, result: `Priority ${task.priority}, ${task.category}.` });
      break;
    }
    case 'Idea': {
      const idea = NoelData.createIdea({ ...action.fields, source: action.raw ? 'voice' : 'manual' });
      UNDO_HANDLERS.set(undoId, () => NoelData.deleteIdea(idea.id));
      record = NoelData.logActivity({ id: undoId, input: action.raw, action: `Idea captured: ${idea.text}`, result: `Filed under ${idea.category}.` });
      break;
    }
    case 'Note': {
      const note = NoelData.createNote({ ...action.fields, source: action.raw ? 'voice' : 'manual' });
      UNDO_HANDLERS.set(undoId, () => NoelData.deleteNote(note.id));
      record = NoelData.logActivity({ id: undoId, input: action.raw, action: `Note saved: ${note.text}`, result: `Filed under ${note.category}${note.client ? ' · ' + note.client : ''}.` });
      break;
    }
  }
  return record;
}

let pendingAmbiguous = null;
let pendingConfirmation = null;

function processCapture(text) {
  const parsed = NoelParser.parseCapture(text);
  if (parsed.actions.length === 1 && parsed.actions[0].type === 'Ambiguous') {
    pendingAmbiguous = parsed.actions[0];
    document.getElementById('ambiguousModalText').textContent = `"${text}" — is this a Task, an Idea, or a Note?`;
    document.getElementById('ambiguousModalBackdrop').classList.add('active');
    return;
  }
  const settings = NoelData.getSettings();
  const anyNeedsConfirm = parsed.actions.some(a => a.needsConfirmation) || parsed.isMultiAction || !settings.autoConfirmLowRisk;
  if (anyNeedsConfirm) {
    openConfirmModal(parsed);
  } else {
    parsed.actions.forEach(applyAction);
    showToast('Updated.', { undoId: null });
    renderCurrentScreen();
  }
}

function openConfirmModal(parsed) {
  pendingConfirmation = parsed;
  const list = document.getElementById('confirmActionsList');
  list.innerHTML = parsed.actions.map((a, idx) => `
    <div class="confirm-action-row">
      <div><div class="confirm-action-type">${a.type}</div><div class="confirm-action-detail">${escapeHtml(actionSummary(a))}</div></div>
    </div>`).join('');
  document.getElementById('confirmModalBackdrop').classList.add('active');
}

/* ============================================================
   VOICE
   ============================================================ */
function setVoiceState(state, transcript) {
  const overlay = document.getElementById('voiceOverlay');
  const stateEl = document.getElementById('voiceState');
  const transcriptEl = document.getElementById('voiceTranscript');
  if (state === 'listening') { overlay.classList.add('active'); stateEl.textContent = 'Listening…'; transcriptEl.textContent = ''; }
  else if (state === 'understanding') { stateEl.textContent = 'Understanding…'; }
  else if (state === 'done') { stateEl.textContent = 'Updated.'; transcriptEl.textContent = transcript || ''; setTimeout(() => overlay.classList.remove('active'), 700); }
  else if (state === 'error') { overlay.classList.remove('active'); }
  else if (state === 'idle') { overlay.classList.remove('active'); }
}
function startVoiceCapture() {
  NoelVoice.transcribeAudio({
    onState: (s) => setVoiceState(s),
    onResult: (transcript) => {
      setVoiceState('done', transcript);
      if (transcript) handleUniversalInput(transcript);
    },
    onError: (err) => { setVoiceState('error'); showToast(err.message); },
  });
}

/* ============================================================
   WIRE UP GLOBAL UI
   ============================================================ */
const RENDERERS = {
  home: renderHome, tasks: renderTasks, money: renderMoney, clients: renderClients,
  pipeline: renderPipeline, fifthzero: renderFifthZero, ideas: renderIdeas, notes: renderNotes,
  memory: renderMemory, calendar: renderCalendar, assistant: renderAssistant, settings: renderSettings,
};

function wireGlobalUI() {
  document.querySelectorAll('.bottom-nav-item[data-nav]').forEach(b => b.addEventListener('click', () => goScreen(b.dataset.nav)));
  document.getElementById('micBtnMobile').addEventListener('click', startVoiceCapture);
  document.getElementById('micBtnDesktop').addEventListener('click', startVoiceCapture);

  document.getElementById('searchBtn').addEventListener('click', openSearch);
  document.getElementById('searchNavBtn').addEventListener('click', openSearch);
  document.getElementById('searchCloseBtn').addEventListener('click', closeSearch);
  document.getElementById('searchInput').addEventListener('input', (e) => renderSearchResults(e.target.value));
  document.getElementById('searchModalBackdrop').addEventListener('click', (e) => { if (e.target.id === 'searchModalBackdrop') closeSearch(); });

  document.getElementById('confirmAllBtn').addEventListener('click', () => {
    if (pendingConfirmation) {
      pendingConfirmation.actions.forEach(applyAction);
      showToast('Updated.');
      pendingConfirmation = null;
    }
    document.getElementById('confirmModalBackdrop').classList.remove('active');
    renderCurrentScreen();
  });
  document.getElementById('confirmCancelBtn').addEventListener('click', () => {
    pendingConfirmation = null;
    document.getElementById('confirmModalBackdrop').classList.remove('active');
  });
  document.getElementById('confirmEditBtn').addEventListener('click', () => {
    const raw = pendingConfirmation ? pendingConfirmation.raw : '';
    pendingConfirmation = null;
    document.getElementById('confirmModalBackdrop').classList.remove('active');
    goScreen('home');
    setTimeout(() => {
      const input = document.getElementById('universalCaptureInput');
      if (input) { input.value = raw; input.focus(); }
    }, 30);
  });

  document.querySelectorAll('[data-ambiguous]').forEach(b => b.addEventListener('click', () => {
    if (!pendingAmbiguous) return;
    const type = b.dataset.ambiguous;
    const text = pendingAmbiguous.fields.text;
    document.getElementById('ambiguousModalBackdrop').classList.remove('active');
    const clientHit = NoelData.getClients().find(c => text.toLowerCase().includes(c.name.toLowerCase()));
    let action;
    if (type === 'Task') action = { type: 'Task', raw: text, fields: { title: text, category: clientHit ? 'Client Work' : 'Personal', priority: 'P3', client: clientHit ? clientHit.name : null } };
    if (type === 'Idea') action = { type: 'Idea', raw: text, fields: { text, category: 'Creative' } };
    if (type === 'Note') action = { type: 'Note', raw: text, fields: { text, category: clientHit ? 'Client' : 'Personal', client: clientHit ? clientHit.name : null } };
    applyAction(action);
    showToast('Updated.');
    pendingAmbiguous = null;
    renderCurrentScreen();
  }));
  document.getElementById('ambiguousCancelBtn').addEventListener('click', () => {
    pendingAmbiguous = null;
    document.getElementById('ambiguousModalBackdrop').classList.remove('active');
  });

  const QUICK_CAPTURES = [
    { icon: '+', label: 'Task', open: () => quickForm('Task', taskQuickFields()) },
    { icon: '💡', label: 'Idea', open: () => quickForm('Idea', ideaQuickFields()) },
    { icon: '📝', label: 'Note', open: () => quickForm('Note', noteQuickFields()) },
    { icon: '💰', label: 'Expense', open: () => quickForm('Expense', moneyQuickFields('expense')) },
    { icon: '📥', label: 'Income', open: () => quickForm('Income', moneyQuickFields('income')) },
  ];
  document.getElementById('quickCaptureRow').innerHTML = QUICK_CAPTURES.map((q, idx) => `<button class="quick-capture-btn" data-quick="${idx}" title="${q.label}">${q.icon}</button>`).join('');
  document.querySelectorAll('[data-quick]').forEach(b => b.addEventListener('click', () => QUICK_CAPTURES[b.dataset.quick].open()));

  document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    const order = NAV.map(n => n.id);
    const idx = order.indexOf(currentScreen);
    goScreen(order[(idx + 1) % order.length]);
  });
}

function taskQuickFields() {
  return `<div class="field"><label>Title</label><input id="qTitle" required /></div>
    <div class="field"><label>Priority</label><select id="qPriority"><option>P1</option><option>P2</option><option selected>P3</option><option>P4</option></select></div>`;
}
function ideaQuickFields() { return `<div class="field"><label>Idea</label><textarea id="qText" rows="2" required></textarea></div>`; }
function noteQuickFields() { return `<div class="field"><label>Note</label><textarea id="qText" rows="2" required></textarea></div>`; }
function moneyQuickFields() { return `<div class="field"><label>Amount (₹)</label><input type="number" id="qAmount" required /></div><div class="field"><label>Category / from</label><input id="qNote" /></div>`; }

function quickForm(type, fieldsHtml) {
  document.getElementById('quickModalTitle').textContent = `Add ${type}`;
  document.getElementById('quickModalBody').innerHTML = `
    <form id="quickForm">${fieldsHtml}<div class="modal-actions"><button type="button" class="btn btn-ghost" id="quickCancel">Cancel</button><button class="btn btn-primary">Save</button></div></form>`;
  document.getElementById('quickModalBackdrop').classList.add('active');
  document.getElementById('quickCancel').addEventListener('click', () => document.getElementById('quickModalBackdrop').classList.remove('active'));
  document.getElementById('quickForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (type === 'Task') NoelData.createTask({ title: document.getElementById('qTitle').value, priority: document.getElementById('qPriority').value, source: 'quick-capture' });
    if (type === 'Idea') NoelData.createIdea({ text: document.getElementById('qText').value, source: 'quick-capture' });
    if (type === 'Note') NoelData.createNote({ text: document.getElementById('qText').value, source: 'quick-capture' });
    if (type === 'Expense') NoelData.recordExpense(Number(document.getElementById('qAmount').value));
    if (type === 'Income') NoelData.recordGenericIncome(Number(document.getElementById('qAmount').value));
    if (type === 'Expense' || type === 'Income') NoelData.logActivity({ action: `${type} recorded: ${NoelData.formatINR(Number(document.getElementById('qAmount').value))}`, result: 'Cash updated.' });
    document.getElementById('quickModalBackdrop').classList.remove('active');
    showToast('Saved.');
    renderCurrentScreen();
  });
}

/* ---------------- PWA ---------------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

/* ---------------- boot ---------------- */
wireGlobalUI();
goScreen('home');
