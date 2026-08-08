/* ============================================================
   NOEL OS — UI layer (router + pages + capture pipeline)
   ============================================================ */

const NAV = [
  { id: 'home', label: 'Home' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'money', label: 'Finance' },
  { id: 'crm', label: 'CRM' },
  { id: 'fifthzero', label: 'Projects' },
  { id: 'ideas', label: 'Ideas' },
  { id: 'notes', label: 'Notes' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'review', label: 'Review' },
  { id: 'memory', label: 'Memory' },
  { id: 'assistant', label: 'Assistant' },
  { id: 'settings', label: 'Settings' },
];

let currentScreen = 'home';
let moneyTab = 'overview';
let crmTab = 'pipeline';
let taskFilter = 'active';
let ideaFilter = 'all';
const UNDO_HANDLERS = new Map();
const chatLog = [];

const root = () => document.getElementById('pageRoot');
function escapeHtml(s) { return (s ?? '').toString().replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function pageHeader(title, desc, actionHtml) {
  return `<div class="page-header"><div><div class="page-title">${title}</div><div class="page-desc">${desc}</div></div>${actionHtml || ''}</div>`;
}
function moduleHead(num, label, statusHtml) {
  return `<div class="module-head"><span class="module-num mono">${num}</span><span class="module-label">// ${escapeHtml(label)}</span><span class="module-rule"></span>${statusHtml ? `<span class="module-status">${statusHtml}</span>` : ''}</div>`;
}
function formatDueLabel(dateStr) {
  if (!dateStr) return null;
  const today = NoelData.isoDateOnly(new Date());
  const tomorrow = NoelData.isoDateOnly(NoelData.addDays(new Date(), 1));
  if (dateStr === today) return 'TODAY';
  if (dateStr === tomorrow) return 'TOMORROW';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase();
}
function formatDateBadge(iso) {
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
}

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
  el.innerHTML = NAV.map(n => `<button class="nav-item ${currentScreen === n.id ? 'active' : ''}" data-nav="${n.id}">${n.label}</button>`).join('');
  el.querySelectorAll('[data-nav]').forEach(b => b.addEventListener('click', () => goScreen(b.dataset.nav)));

  document.querySelectorAll('.bottom-nav-item[data-nav]').forEach(b => {
    const mapped = b.dataset.nav === 'money' ? 'money' : b.dataset.nav;
    b.classList.toggle('active', mapped === currentScreen);
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
  const activeCount = NoelData.getTasks().filter(t => t.status !== 'Completed' && t.status !== 'Cancelled').length;
  const blockers = NoelData.getBlockers();
  const money = NoelData.getMoneySummary();
  const pipeline = NoelData.getPipeline().slice(0, 3);
  const fz = NoelData.getFifthZero();
  const ideas = NoelData.getIdeas().slice(0, 3);
  const notes = NoelData.getNotes().slice(0, 3);
  const activity = NoelData.getActivityLog(6);
  const tasksDone = NoelData.getTasks().filter(t => t.status === 'Completed').length;

  root().innerHTML = `
    <div class="module">
      ${moduleHead('01', 'Operator', '<span class="live-dot"></span>ONLINE')}
      <div class="panel" style="padding:16px 18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div>
          <div style="font-size:15px;font-weight:600;letter-spacing:.01em;">${escapeHtml((settings.name || '').toUpperCase())}</div>
          <div class="task-meta" style="margin-top:4px;">${escapeHtml((settings.role || '').toUpperCase())} · ${escapeHtml((settings.location || '').toUpperCase())}</div>
        </div>
        <div style="text-align:right;">
          <div class="stat-label">FOCUS</div>
          <div style="font-size:12.5px;margin-top:2px;max-width:260px;">${escapeHtml(settings.todayFocus || 'Not set')}</div>
        </div>
      </div>
    </div>

    <div class="module">
      ${moduleHead('02', 'Session', `${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()} · LOCAL TIME`)}
      <div class="panel" style="padding:20px 20px 18px;">
        <div class="greeting serif-italic">${greetingWord()}, ${escapeHtml(settings.name)}.</div>
        <form id="todayFocusForm" style="margin-top:14px;padding-top:14px;border-top:1px solid var(--divider);display:flex;align-items:center;gap:10px;">
          <span class="stat-label" style="flex-shrink:0;">TODAY I WILL</span>
          <input id="todayFocusInput" value="${escapeHtml(settings.todayFocus || '')}" placeholder="Set today's one thing…" style="flex:1;font-size:13px;" />
        </form>
        <form id="universalCaptureForm" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--divider);display:flex;gap:8px;align-items:center;">
          <input id="universalCaptureInput" class="capture-input mono" placeholder="Paid Clyde ₹5,000 · Idea for Fifth &amp; Zero… · What should I do today?" />
          <button class="btn btn-primary" type="submit">Capture ↵</button>
        </form>
      </div>
    </div>

    <div class="module">
      ${moduleHead('03', 'Priorities', `${top.length} OF ${activeCount}<button class="linklike" data-nav-to="tasks" style="margin-left:8px;">VIEW ALL</button>`)}
      <div class="panel" id="homeTasks"></div>
    </div>

    <div class="module">
      ${moduleHead('04', 'Key Blockers', blockers.length ? `${blockers.length} ACTIVE` : 'NONE')}
      <div class="panel" id="homeBlockers"></div>
    </div>

    <div class="module">
      ${moduleHead('05', 'Money', `<button class="linklike" data-nav-to="money">VIEW ALL</button>`)}
      <div class="panel">
        <div class="stat-row"><span class="stat-label">Cash</span><span class="stat-value tnum">${NoelData.formatINR(money.cash)}</span></div>
        <div class="stat-row"><span class="stat-label">Receivables</span><span class="stat-value tnum">${NoelData.formatINR(money.receivables)}</span></div>
        <div class="stat-row"><span class="stat-label">Debt</span><span class="stat-value tnum" style="color:var(--p1);">${NoelData.formatINR(money.debt)}</span></div>
        <div class="stat-row"><span class="stat-label">Monthly burn</span><span class="stat-value tnum">${NoelData.formatINR(money.burn)}</span></div>
      </div>
    </div>

    <div class="module">
      ${moduleHead('06', 'Pipeline', `<button class="linklike" data-nav-to="crm">VIEW ALL</button>`)}
      <div class="panel" id="homePipeline"></div>
    </div>

    <div class="module">
      ${moduleHead('07', 'Fifth & Zero', `<button class="linklike" data-nav-to="fifthzero">VIEW ALL</button>`)}
      <div class="panel" id="homeFz"></div>
    </div>

    <div class="module">
      ${moduleHead('08', 'Ideas', `<button class="linklike" data-nav-to="ideas">VIEW ALL</button>`)}
      <div class="panel" id="homeIdeas"></div>
    </div>

    <div class="module">
      ${moduleHead('09', 'Notes', `<button class="linklike" data-nav-to="notes">VIEW ALL</button>`)}
      <div class="panel" id="homeNotes"></div>
    </div>

    <div class="module">
      ${moduleHead('10', 'Review', `<button class="linklike" data-nav-to="review">OPEN FULL REVIEW</button>`)}
      <div class="panel" style="padding:14px 18px;">
        <div class="task-meta" style="font-size:10.5px;">${tasksDone} TASKS COMPLETED · ${NoelData.getIdeas().length} IDEAS CAPTURED · ${pipeline.length} DEALS IN MOTION</div>
      </div>
    </div>

    <details class="disclosure">
      <summary>System log</summary>
      <div class="disclosure-body panel" id="homeActivity"></div>
    </details>
  `;

  document.getElementById('homeTasks').innerHTML = top.length ? top.map(taskRow).join('') :
    `<div class="empty"><div class="empty-title">Nothing urgent right now.</div>You've got some breathing room.</div>`;
  wireTaskRowEvents(document.getElementById('homeTasks'));

  document.getElementById('homeBlockers').innerHTML = blockers.length ? blockers.map(blockerRow).join('') :
    `<div class="empty"><div class="empty-title">Nothing's stuck.</div>Everything is moving.</div>`;

  document.getElementById('homePipeline').innerHTML = pipeline.length ? pipeline.map(pipelineRow).join('') :
    `<div class="empty">Your pipeline is quiet. Good time to create.</div>`;

  document.getElementById('homeFz').innerHTML = fz.map(fzRow).join('');

  document.getElementById('homeIdeas').innerHTML = ideas.length ? ideas.map((i, idx) => ideaRow(i, idx)).join('') : `<div class="empty"><div class="empty-title">Your brain is quiet here.</div>Capture an idea whenever it hits.</div>`;
  wireIdeaRowEvents(document.getElementById('homeIdeas'));

  document.getElementById('homeNotes').innerHTML = notes.length ? notes.map((n, idx) => noteRow(n, idx)).join('') : `<div class="empty"><div class="empty-title">Nothing saved here yet.</div>Capture a note whenever it matters.</div>`;

  document.getElementById('homeActivity').innerHTML = activity.length ? activity.map(activityRow).join('') : `<div class="empty">Nothing logged yet.</div>`;
  wireActivityRowEvents(document.getElementById('homeActivity'));

  root().querySelectorAll('[data-nav-to]').forEach(b => b.addEventListener('click', () => goScreen(b.dataset.navTo)));
  document.getElementById('todayFocusForm').addEventListener('submit', (e) => {
    e.preventDefault();
    NoelData.updateSettings({ todayFocus: document.getElementById('todayFocusInput').value.trim() });
    showToast('Saved.');
  });
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
  const done = t.status === 'Completed';
  const dueLabel = formatDueLabel(t.due_date);
  const context = t.client || t.project || t.category;
  const metaParts = [dueLabel, context ? context.toUpperCase() : null].filter(Boolean);
  return `<div class="list-item" data-task="${t.id}">
    <button class="checkbox ${done ? 'checked' : ''}" data-toggle="${t.id}">${done ? '✓' : ''}</button>
    <select class="priority-text p${t.priority.slice(1)}" data-priority="${t.id}">
      ${['P1', 'P2', 'P3', 'P4'].map(p => `<option value="${p}" ${p === t.priority ? 'selected' : ''}>${p}</option>`).join('')}
    </select>
    <div class="list-item-main">
      <div class="task-title ${done ? 'done' : ''}">${escapeHtml(t.title)}</div>
      ${metaParts.length ? `<div class="task-meta">${metaParts.map(escapeHtml).join(' · ')}</div>` : ''}
    </div>
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

function blockerRow(b) {
  const meta = [b.kind, b.days ? `${b.days}D` : null, b.owner ? b.owner.toUpperCase() : null, b.reason ? b.reason.toUpperCase() : null].filter(Boolean).join(' · ');
  const color = b.kind === 'OVERDUE' ? 'var(--p1)' : b.kind === 'BLOCKED' ? 'var(--p2)' : 'var(--p3)';
  return `<div class="blocker-row">
    <div><div class="blocker-title">${escapeHtml(b.title)}</div><div class="blocker-meta">${meta}</div></div>
    <span class="badge" style="color:${color};">${b.kind}</span>
  </div>`;
}

function ideaRow(i, idx) {
  const priorityWord = { HOT: 'HOT', INTERESTING: 'INTERESTING', SOMEDAY: 'SOMEDAY' }[i.priority] || 'SOMEDAY';
  const metaParts = [i.project && i.project !== i.category ? i.project : null, i.category, priorityWord].filter(Boolean);
  return `<div class="list-item">
    <span class="idea-icon">💡</span>
    <div class="list-item-main">
      <div class="task-title">${escapeHtml(i.text)}</div>
      <div class="task-meta">${metaParts.map(m => escapeHtml(m.toUpperCase())).join(' · ')}</div>
    </div>
    <button class="icon-btn" data-idea-to-task="${i.id}" title="Turn into task">↗</button>
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

function noteRow(n, idx) {
  const metaParts = [n.category, n.client].filter(Boolean);
  return `<div class="list-item">
    <span class="note-icon">📝</span>
    <div class="list-item-main">
      <div class="task-title">${escapeHtml(n.text)}</div>
      <div class="task-meta">${metaParts.map(m => escapeHtml(m.toUpperCase())).join(' · ')}</div>
    </div>
    <button class="icon-btn" data-del-note="${n.id}" title="Delete">✕</button>
  </div>`;
}
function wireNoteRowEvents(container) {
  container.querySelectorAll('[data-del-note]').forEach(b => b.addEventListener('click', () => { NoelData.deleteNote(b.dataset.delNote); renderCurrentScreen(); }));
}

function pipelineRow(p) {
  const amt = p.amount ? NoelData.formatINR(p.amount) + (p.recurring ? ` + ${NoelData.formatINR(p.recurring)}/MO` : '') : `${NoelData.formatINR(p.amountLow)}–${NoelData.formatINR(p.amountHigh)}`;
  const stageColor = { 'IN TALKS': 'var(--p2)', FORECAST: 'var(--p3)', POTENTIAL: 'var(--muted)', CONFIRMED: 'var(--good)', RECEIVABLE: 'var(--accent)', PAID: 'var(--good)' }[p.stage] || 'var(--muted)';
  return `<div class="list-item">
    <div class="list-item-main">
      <div class="task-title">${escapeHtml(p.client.toUpperCase())} <span style="color:var(--muted);font-weight:400;">— ${escapeHtml(p.description)}</span></div>
      <div class="task-meta">${amt.toUpperCase()}</div>
    </div>
    <span class="badge" style="color:${stageColor};">${p.stage}</span>
  </div>`;
}

function fzRow(f) {
  return `<div class="list-item">
    <span class="fz-dot ${f.status}"></span>
    <div class="list-item-main">
      <div class="task-title">${escapeHtml(f.name.toUpperCase())}</div>
      ${f.blockedReason ? `<div class="task-meta">BLOCKED · ${escapeHtml(f.blockedReason.toUpperCase())}</div>` : ''}
    </div>
  </div>`;
}

function activityRow(a) {
  const canUndo = UNDO_HANDLERS.has(a.id);
  const time = new Date(a.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase();
  return `<div class="list-item" style="align-items:flex-start;">
    <div class="list-item-main">
      <div class="task-meta">${time}${a.input ? ` · "${escapeHtml(a.input)}"` : ''}</div>
      <div class="task-title" style="font-size:12px;margin-top:3px;">${escapeHtml(a.action)}</div>
      ${a.result ? `<div class="task-meta">${escapeHtml(a.result.toUpperCase())}</div>` : ''}
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
    ${pageHeader('Tasks', 'Everything that needs doing', `<button class="btn btn-primary" id="newTaskBtn">+ New</button>`)}
    <div class="tab-row">${TASK_FILTERS.map(f => `<button class="tab-btn ${f === taskFilter ? 'active' : ''}" data-tfilter="${f}">${f}</button>`).join('')}</div>
    <div id="taskForm"></div>
    <div class="panel" id="taskList"></div>`;

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
const IDEA_FILTERS = [['all', 'All'], ['HOT', 'Hot'], ['INTERESTING', 'Interesting'], ['SOMEDAY', 'Someday']];
function renderIdeas() {
  const all = NoelData.getIdeas();
  const filtered = ideaFilter === 'all' ? all : all.filter(i => i.priority === ideaFilter);
  root().innerHTML = `
    ${pageHeader('Ideas', 'Captured intelligence — not yet a task', `<button class="btn btn-primary" id="newIdeaBtn">+ New</button>`)}
    <div class="tab-row">${IDEA_FILTERS.map(([id, label]) => `<button class="tab-btn ${id === ideaFilter ? 'active' : ''}" data-ifilter="${id}">${label}</button>`).join('')}</div>
    <div id="ideaForm"></div>
    <div class="panel" id="ideaList">${filtered.length ? filtered.map((i, idx) => ideaRow(i, idx)).join('') : `<div class="empty"><div class="empty-title">Your brain is quiet here.</div>Capture an idea whenever it hits.</div>`}</div>`;
  document.querySelectorAll('[data-ifilter]').forEach(b => b.addEventListener('click', () => { ideaFilter = b.dataset.ifilter; renderIdeas(); }));
  wireIdeaRowEvents(document.getElementById('ideaList'));
  document.getElementById('newIdeaBtn').addEventListener('click', () => {
    document.getElementById('ideaForm').innerHTML = `
      <form class="form-card" id="iForm">
        <div class="field"><label>Idea</label><textarea id="iText" rows="2" required></textarea></div>
        <div class="form-row">
          <div class="field"><label>Category</label><select id="iCategory">${['Creative', 'Business', 'Fifth & Zero', 'Content', 'Campaign', 'Client', 'Product', 'AI', 'Personal', 'Learning'].map(c => `<option>${c}</option>`).join('')}</select></div>
          <div class="field"><label>Priority</label><select id="iPriority"><option value="HOT">Hot</option><option value="INTERESTING" selected>Interesting</option><option value="SOMEDAY">Someday</option></select></div>
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
    ${pageHeader('Notes', 'Searchable, permanent memory', `<button class="btn btn-primary" id="newNoteBtn">+ New</button>`)}
    <div id="noteForm"></div>
    <div class="panel" id="noteList">${all.length ? all.map((n, idx) => noteRow(n, idx)).join('') : `<div class="empty"><div class="empty-title">Nothing saved here yet.</div>Capture a note whenever it matters.</div>`}</div>`;
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
   MONEY / FINANCE PAGE (overview / debt / receivables)
   ============================================================ */
function renderMoney() {
  const money = NoelData.getMoneySummary();
  root().innerHTML = `
    ${pageHeader('Finance', 'Numbers and structure — no charts needed', '')}
    <div class="tab-row">
      ${[['overview', 'Overview'], ['debt', 'Liabilities'], ['receivables', 'Receivables']].map(([id, l]) => `<button class="tab-btn ${id === moneyTab ? 'active' : ''}" data-mtab="${id}">${l}</button>`).join('')}
    </div>
    <div id="moneyBody"></div>`;
  document.querySelectorAll('[data-mtab]').forEach(b => b.addEventListener('click', () => { moneyTab = b.dataset.mtab; renderMoney(); }));

  const body = document.getElementById('moneyBody');
  if (moneyTab === 'overview') {
    body.innerHTML = `
      ${moduleHead('a1', 'Liquid Cash', '')}
      <div class="panel" style="padding:14px 18px;margin-bottom:22px;"><div class="card-value tnum">${NoelData.formatINR(money.cash)}</div></div>
      ${moduleHead('a2', 'Receivables', '')}
      <div class="panel" style="padding:14px 18px;margin-bottom:22px;"><div class="card-value tnum">${NoelData.formatINR(money.receivables)}</div></div>
      ${moduleHead('a3', 'Liabilities', '')}
      <div class="panel" style="padding:14px 18px;margin-bottom:22px;"><div class="card-value tnum" style="color:var(--p1);">${NoelData.formatINR(money.debt)}</div></div>
      ${moduleHead('a4', 'Monthly Burn', '')}
      <div class="panel" style="padding:14px 18px;margin-bottom:26px;"><div class="card-value tnum">${NoelData.formatINR(money.burn)}</div></div>
      <div class="module-head"><span class="module-label">// QUICK CAPTURE</span><span class="module-rule"></span></div>
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
      <div class="panel" style="padding:14px 18px;margin-bottom:20px;"><div class="stat-label">Total remaining</div><div class="card-value tnum" style="color:var(--p1);">${NoelData.formatINR(NoelData.totalDebt())}</div></div>
      ${moduleHead('b1', 'Priority Order', '')}
      <div class="panel" id="debtList" style="margin-bottom:22px;">${debts.map(debtRow).join('')}</div>
      ${moduleHead('b2', 'Recurring Commitments', '')}
      <div class="panel">${recurring.map(r => `<div class="stat-row"><span class="stat-label">${escapeHtml(r.name.toUpperCase())} · ${r.remainingMonths}/${r.termMonths}MO</span><span class="stat-value tnum">${NoelData.formatINR(r.amount)}/MO</span></div>`).join('')}</div>`;
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
      <div class="panel" style="padding:14px 18px;margin-bottom:20px;"><div class="stat-label">Total expected</div><div class="card-value tnum">${NoelData.formatINR(NoelData.totalReceivables())}</div></div>
      <div class="panel" id="recList">${rec.map(receivableRow).join('')}</div>`;
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
  return `<div class="stat-row">
    <span class="stat-label" style="${paid ? 'text-decoration:line-through;' : ''}"><span class="mono" style="color:var(--muted);margin-right:8px;">${String(idx + 1).padStart(2, '0')}</span>${escapeHtml((d.person || d.name).toUpperCase())}</span>
    <span style="display:flex;align-items:center;gap:10px;">
      ${paid ? `<span class="badge badge-good">PAID</span>` : `<span class="stat-value tnum">${NoelData.formatINR(d.amount)}</span><button class="btn btn-ghost btn-sm" data-pay-debt="${d.id}">Pay</button>`}
    </span>
  </div>`;
}
function receivableRow(r) {
  const paid = r.status === 'paid';
  const tbd = r.status === 'tbd';
  return `<div class="stat-row">
    <span class="stat-label">${escapeHtml(r.name.toUpperCase())}</span>
    <span style="display:flex;align-items:center;gap:10px;">
      <span class="stat-value tnum">${tbd ? 'TBD' : NoelData.formatINR(r.amount)}</span>
      ${paid ? `<span class="badge badge-good">RECEIVED</span>` : tbd ? '' : `<button class="btn btn-ghost btn-sm" data-receive="${r.id}">Received</button>`}
    </span>
  </div>`;
}

/* ============================================================
   CRM PAGE (pipeline / clients / leads)
   ============================================================ */
function renderCRM() {
  const pipeline = NoelData.getPipeline();
  const clients = NoelData.getClients();
  const leads = NoelData.getLeads();
  root().innerHTML = `
    ${pageHeader('CRM', `Pipeline ${pipeline.length} · Clients ${clients.length} · Leads ${leads.length}`, '')}
    <div class="tab-row">
      ${[['pipeline', 'Pipeline'], ['clients', 'Clients'], ['leads', 'Leads']].map(([id, l]) => `<button class="tab-btn ${id === crmTab ? 'active' : ''}" data-crmtab="${id}">${l}</button>`).join('')}
    </div>
    <div id="crmBody"></div>`;
  document.querySelectorAll('[data-crmtab]').forEach(b => b.addEventListener('click', () => { crmTab = b.dataset.crmtab; renderCRM(); }));

  const body = document.getElementById('crmBody');
  if (crmTab === 'pipeline') {
    body.innerHTML = `<div class="panel">${pipeline.length ? pipeline.map(pipelineRow).join('') : `<div class="empty">Your pipeline is quiet. Good time to create.</div>`}</div>`;
  } else if (crmTab === 'clients') {
    body.innerHTML = `
      <div id="clientForm"></div>
      <div class="panel" id="clientList">${clients.length ? clients.map(c => `
        <div class="list-item"><div class="list-item-main"><div class="task-title">${escapeHtml(c.name.toUpperCase())}</div><div class="task-meta">${escapeHtml(c.status.toUpperCase())}</div></div><span class="badge badge-${c.tag === 'HOT' ? 'p1' : c.tag === 'WARM' ? 'p2' : 'muted'}">${c.tag}</span></div>
      `).join('') : `<div class="empty">No clients yet.</div>`}</div>
      <div style="margin-top:14px;"><button class="btn btn-ghost btn-sm" id="newClientBtn">+ New client</button></div>`;
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
        renderCRM();
      });
    });
  } else {
    body.innerHTML = `<div class="panel">${leads.map(l => `<div class="list-item"><div class="list-item-main">${escapeHtml(l.name)}</div></div>`).join('')}</div>`;
  }
}

/* ============================================================
   FIFTH & ZERO / PROJECTS PAGE
   ============================================================ */
function renderFifthZero() {
  const fz = NoelData.getFifthZero();
  const tasks = NoelData.getTasks().filter(t => t.category === 'Fifth & Zero');
  const ideas = NoelData.getIdeas().filter(i => i.category === 'Fifth & Zero');
  root().innerHTML = `
    ${pageHeader('Fifth & Zero', 'The studio, tracked in one place', '')}
    <div class="panel" id="fzBoard" style="margin-bottom:26px;"></div>
    <div class="module-head"><span class="module-label">// RELATED TASKS</span><span class="module-rule"></span></div>
    <div class="panel" id="fzTasks" style="margin-bottom:26px;">${tasks.length ? tasks.map(taskRow).join('') : `<div class="empty">No Fifth & Zero tasks yet.</div>`}</div>
    <div class="module-head"><span class="module-label">// RELATED IDEAS</span><span class="module-rule"></span></div>
    <div class="panel" id="fzIdeas">${ideas.length ? ideas.map((i, idx) => ideaRow(i, idx)).join('') : `<div class="empty">No Fifth & Zero ideas yet.</div>`}</div>`;
  wireTaskRowEvents(document.getElementById('fzTasks'));
  wireIdeaRowEvents(document.getElementById('fzIdeas'));

  document.getElementById('fzBoard').innerHTML = fz.map(f => `
    <div class="list-item">
      <span class="fz-dot ${f.status}"></span>
      <div class="list-item-main">
        <div class="task-title">${String(f.priority).padStart(2, '0')} · ${escapeHtml(f.name.toUpperCase())}</div>
        <div class="task-meta">${f.blockedReason ? 'BLOCKED · ' + escapeHtml(f.blockedReason.toUpperCase()) : (f.deadline ? 'DEADLINE ' + escapeHtml(f.deadline) : 'NO DEADLINE SET')}</div>
      </div>
      <button class="fz-dot ${f.status}" data-cycle-fz="${f.id}" title="Click to change status" style="cursor:pointer;border:none;"></button>
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
   MEMORY PAGE
   ============================================================ */
const MEMORY_DOCS = ['01 — Personal Context', '02 — Fifth & Zero', '03 — Business Strategy', '04 — Client Context', '05 — Decisions', '06 — Ideas', '07 — SOPs', '08 — Important Conversations'];
function renderMemory() {
  const notes = NoelData.getNotes();
  root().innerHTML = `
    ${pageHeader('Memory', 'Permanent context, current state, and history', '')}
    <div class="panel" style="padding:14px 18px;margin-bottom:20px;">
      <div class="card-title">Google Docs memory — not connected</div>
      <div class="card-sub" style="margin-top:5px;text-transform:none;letter-spacing:0;font-family:var(--font-sans);">In Phase 4 these become real Google Docs. Until then, notes captured here are your memory, stored locally.</div>
    </div>
    <div class="grid grid-2" style="margin-bottom:26px;">${MEMORY_DOCS.map(d => `<div class="card"><div class="card-title">${d}</div><span class="badge badge-muted" style="margin-top:8px;display:inline-flex;">NOT CONNECTED</span></div>`).join('')}</div>
    <div class="module-head"><span class="module-label">// NOTES (LOCAL MEMORY)</span><span class="module-rule"></span></div>
    <div class="panel" id="memoryNotes">${notes.length ? notes.map((n, idx) => noteRow(n, idx)).join('') : `<div class="empty">Nothing remembered yet.</div>`}</div>`;
  wireNoteRowEvents(document.getElementById('memoryNotes'));
}

/* ============================================================
   CALENDAR PAGE
   ============================================================ */
function renderCalendar() {
  const withDates = NoelData.getTasks().filter(t => t.due_date && t.status !== 'Completed').sort((a, b) => a.due_date.localeCompare(b.due_date));
  root().innerHTML = `
    ${pageHeader('Calendar', 'Agenda view of what you owe your time', '')}
    <div class="panel" style="padding:14px 18px;margin-bottom:20px;">
      <div class="card-title">Google Calendar — not connected</div>
      <div class="card-sub" style="margin-top:5px;text-transform:none;letter-spacing:0;font-family:var(--font-sans);">Coming in Phase 8. This agenda is built from task due dates in the meantime.</div>
    </div>
    <div class="panel" id="calList">${withDates.length ? withDates.map(taskRow).join('') : `<div class="empty">Nothing scheduled.</div>`}</div>`;
  wireTaskRowEvents(document.getElementById('calList'));
}

/* ============================================================
   REVIEW PAGE
   ============================================================ */
function renderReview() {
  const money = NoelData.getMoneySummary();
  const tasksDone = NoelData.getTasks().filter(t => t.status === 'Completed');
  const openTop = NoelData.getTodayPriorities(3);
  const pipeline = NoelData.getPipeline();
  const blockers = NoelData.getBlockers();
  const weekLabel = `W${Math.ceil((((new Date() - new Date(new Date().getFullYear(), 0, 1)) / 86400000) + new Date(new Date().getFullYear(), 0, 1).getDay() + 1) / 7)}`;

  root().innerHTML = `
    ${pageHeader('Review', `Weekly review · ${weekLabel}`, '')}
    <div class="grid grid-2" style="margin-bottom:10px;">
      <div class="module">
        <div class="module-head"><span class="module-label">// WINS</span><span class="module-rule"></span></div>
        <div class="panel" style="padding:14px 18px;">
          ${tasksDone.length ? `<div class="serif-italic" style="font-size:13.5px;">${tasksDone.slice(0, 5).map(t => escapeHtml(t.title)).join(', ')}.</div>` : `<div class="empty" style="padding:8px 0;">Nothing sealed yet this week.</div>`}
        </div>
      </div>
      <div class="module">
        <div class="module-head"><span class="module-label">// OPEN LOOPS</span><span class="module-rule"></span></div>
        <div class="panel" style="padding:14px 18px;">
          ${blockers.length ? blockers.map(b => `<div style="font-size:12.5px;margin-bottom:6px;">${escapeHtml(b.title)} — <span class="task-meta" style="display:inline;">${b.kind}${b.days ? ' · ' + b.days + 'D' : ''}</span></div>`).join('') : `<div class="empty" style="padding:8px 0;">Nothing open.</div>`}
        </div>
      </div>
    </div>
    <div class="grid grid-2" style="margin-bottom:10px;">
      <div class="module">
        <div class="module-head"><span class="module-label">// MONEY NOW</span><span class="module-rule"></span></div>
        <div class="panel">
          <div class="stat-row"><span class="stat-label">Cash</span><span class="stat-value tnum">${NoelData.formatINR(money.cash)}</span></div>
          <div class="stat-row"><span class="stat-label">Receivables</span><span class="stat-value tnum">${NoelData.formatINR(money.receivables)}</span></div>
          <div class="stat-row"><span class="stat-label">Debt</span><span class="stat-value tnum" style="color:var(--p1);">${NoelData.formatINR(money.debt)}</span></div>
        </div>
      </div>
      <div class="module">
        <div class="module-head"><span class="module-label">// PEOPLE TO FOLLOW UP WITH</span><span class="module-rule"></span></div>
        <div class="panel" style="padding:14px 18px;">
          ${pipeline.length ? `<div style="font-size:12.5px;">${pipeline.map(p => escapeHtml(p.client)).join(', ')}</div>` : `<div class="empty" style="padding:8px 0;">Pipeline is quiet.</div>`}
        </div>
      </div>
    </div>
    <div class="module">
      <div class="module-head"><span class="module-label">// NEXT — TOP 3</span><span class="module-rule"></span></div>
      <div class="panel" id="reviewNextTop">${openTop.length ? openTop.map(taskRow).join('') : `<div class="empty">Nothing queued.</div>`}</div>
    </div>`;
  wireTaskRowEvents(document.getElementById('reviewNextTop'));
}

/* ============================================================
   ASSISTANT PAGE
   ============================================================ */
const CHAT_SUGGESTIONS = ['What should I do today?', 'How much debt do I have?', 'When can I clear my debt?', 'What money am I expecting?', 'Who should I follow up with?', 'What do I know about Sonia?', 'Show all Fifth & Zero ideas.'];
function renderAssistant() {
  root().innerHTML = `
    ${pageHeader('Assistant', 'Answers from real data — never guesses', '')}
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
    <div class="module-head"><span class="module-label">// GOOGLE WORKSPACE</span><span class="module-rule"></span></div>
    <div class="panel" style="padding:14px 18px;margin-bottom:22px;"><div class="card-title">Not connected</div><div class="card-sub" style="margin-top:5px;text-transform:none;letter-spacing:0;font-family:var(--font-sans);">Sheets, Docs, Calendar and Gmail integrations arrive in Phases 2–4 and 8. Everything today runs on local storage in this browser so you can use the whole app immediately.</div></div>

    <div class="module-head"><span class="module-label">// CAPTURE</span><span class="module-rule"></span></div>
    <div class="panel" style="padding:14px 18px;margin-bottom:22px;">
      <label style="display:flex;align-items:center;gap:10px;font-size:12.5px;">
        <input type="checkbox" id="autoConfirmToggle" ${settings.autoConfirmLowRisk ? 'checked' : ''} />
        Auto-save low-risk captures (tasks, ideas, notes) without asking. Financial changes always ask.
      </label>
    </div>

    <div class="module-head"><span class="module-label">// DATA</span><span class="module-rule"></span></div>
    <div class="panel" style="padding:14px 18px;margin-bottom:22px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div><div class="card-title">Reset to demo data</div><div class="card-sub" style="margin-top:3px;text-transform:none;letter-spacing:0;font-family:var(--font-sans);">Wipes local changes and restores the seeded example data.</div></div>
      <button class="btn btn-ghost" id="resetBtn">Reset</button>
    </div>

    <div class="module-head"><span class="module-label">// SECURITY</span><span class="module-rule"></span></div>
    <div class="panel" style="padding:14px 18px;margin-bottom:22px;"><div class="card-sub" style="text-transform:none;letter-spacing:0;font-family:var(--font-sans);">No credentials are stored in this app. Google OAuth (Phase 2) will use short-lived tokens server-side; nothing financial is hardcoded — every number here is computed from your stored records.</div></div>

    <div class="module-head"><span class="module-label">// ABOUT</span><span class="module-rule"></span></div>
    <div class="panel" style="padding:14px 18px;"><div class="card-sub" style="text-transform:none;letter-spacing:0;font-family:var(--font-sans);">NOEL OS — Phase 1 (UI + deterministic capture + voice + local persistence). See README for the full phase roadmap.</div></div>
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
    case 'Task': return `${a.fields.title}${a.fields.due_date ? ` (due ${a.fields.due_date})` : ''}`;
    case 'Idea': return a.fields.text;
    case 'Note': return a.fields.text;
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
      <span class="confirm-action-index mono">${String(idx + 1).padStart(2, '0')}</span>
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
  if (state === 'listening') { overlay.classList.add('active'); stateEl.textContent = 'Listening...'; transcriptEl.textContent = ''; }
  else if (state === 'understanding') { stateEl.textContent = 'Parsing...'; }
  else if (state === 'done') { stateEl.textContent = 'Updated'; transcriptEl.textContent = transcript || ''; setTimeout(() => overlay.classList.remove('active'), 700); }
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
   TOP STRIP CLOCK
   ============================================================ */
function tickClock() {
  const el = document.getElementById('stripClock');
  if (!el) return;
  const now = new Date();
  const time = now.toLocaleTimeString(undefined, { hour12: false });
  const date = now.toLocaleDateString(undefined, { day: '2-digit', month: 'short' }).toUpperCase();
  el.textContent = `${date} · ${time}`;
}

/* ============================================================
   WIRE UP GLOBAL UI
   ============================================================ */
const RENDERERS = {
  home: renderHome, tasks: renderTasks, money: renderMoney, crm: renderCRM,
  fifthzero: renderFifthZero, ideas: renderIdeas, notes: renderNotes,
  memory: renderMemory, calendar: renderCalendar, review: renderReview,
  assistant: renderAssistant, settings: renderSettings,
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

  document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    const order = NAV.map(n => n.id);
    const idx = order.indexOf(currentScreen);
    goScreen(order[(idx + 1) % order.length]);
  });

  tickClock();
  setInterval(tickClock, 1000);
}

/* ---------------- PWA ---------------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

/* ---------------- boot ---------------- */
wireGlobalUI();
goScreen('home');
