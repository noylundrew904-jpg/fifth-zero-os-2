/* ============================================================
   FIFTH ZERO OS — static site logic (vanilla JS + Supabase)
   ============================================================ */

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let authMode = 'signin'; // signin | signup
let currentScreen = 'inbox';

const NAV = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'projects', label: 'Projects' },
  { id: 'clients', label: 'Clients' },
  { id: 'finance', label: 'Finance' },
  { id: 'journal', label: 'Journal' },
];

/* ---------------- AUTH ---------------- */
const authWrap = document.getElementById('authWrap');
const appShell = document.getElementById('appShell');
const authForm = document.getElementById('authForm');
const authError = document.getElementById('authError');
const authSub = document.getElementById('authSub');
const authSubmit = document.getElementById('authSubmit');
const authToggle = document.getElementById('authToggle');

authToggle.addEventListener('click', () => {
  authMode = authMode === 'signin' ? 'signup' : 'signin';
  authSub.textContent = authMode === 'signin' ? 'Sign in to your operating system' : 'Create your account';
  authSubmit.textContent = authMode === 'signin' ? 'Sign in' : 'Sign up';
  authToggle.textContent = authMode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in';
  authError.textContent = '';
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.textContent = '';
  authSubmit.disabled = true;
  authSubmit.textContent = 'Please wait…';
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;

  const { error } = authMode === 'signin'
    ? await db.auth.signInWithPassword({ email, password })
    : await db.auth.signUp({ email, password });

  authSubmit.disabled = false;
  authSubmit.textContent = authMode === 'signin' ? 'Sign in' : 'Sign up';

  if (error) authError.textContent = error.message;
  else if (authMode === 'signup') authError.textContent = 'Check your email to confirm, then sign in.';
});

document.getElementById('signOutBtn').addEventListener('click', () => db.auth.signOut());

db.auth.onAuthStateChange((_event, session) => {
  if (session) {
    authWrap.style.display = 'none';
    appShell.classList.add('active');
    document.getElementById('userEmail').textContent = session.user.email;
    document.getElementById('userAvatar').textContent = (session.user.email || 'N')[0].toUpperCase();
    renderNav();
    goScreen(currentScreen);
  } else {
    authWrap.style.display = 'flex';
    appShell.classList.remove('active');
  }
});

/* ---------------- NAV ---------------- */
function renderNav() {
  const el = document.getElementById('navList');
  el.innerHTML = NAV.map(n => `<button class="nav-item ${currentScreen === n.id ? 'active' : ''}" data-nav="${n.id}">${n.label}</button>`).join('');
  el.querySelectorAll('[data-nav]').forEach(b => b.addEventListener('click', () => goScreen(b.dataset.nav)));
}
function goScreen(id) {
  currentScreen = id;
  renderNav();
  RENDERERS[id]();
}

/* ---------------- HELPERS ---------------- */
const root = () => document.getElementById('pageRoot');
function pageHeader(title, desc, actionHtml) {
  return `<div class="page-header"><div><div class="page-title">${title}</div><div class="page-desc">${desc}</div></div>${actionHtml || ''}</div>`;
}
function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ============================================================
   INBOX
   ============================================================ */
async function renderInboxPage() {
  root().innerHTML = `
    ${pageHeader('Inbox', 'Capture first, file later')}
    <form class="form-card" id="inboxForm">
      <div class="field"><label>Capture</label><input id="inboxContent" placeholder="Type or paste a quick note…" required /></div>
      <div class="field"><label>File under (optional)</label><input id="inboxCategory" placeholder="e.g. Puffy Campaign, Finance…" /></div>
      <div class="error-text" id="inboxError"></div>
      <button class="btn btn-primary">Capture</button>
    </form>
    <div id="inboxList" class="loading">Loading…</div>`;

  document.getElementById('inboxForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = document.getElementById('inboxContent').value.trim();
    const category = document.getElementById('inboxCategory').value.trim();
    if (!content) return;
    const { error } = await db.from('inbox_items').insert({ content, category: category || null });
    if (error) { document.getElementById('inboxError').textContent = error.message; return; }
    e.target.reset();
    loadInboxList();
  });
  loadInboxList();
}
async function loadInboxList() {
  const { data, error } = await db.from('inbox_items').select('*').order('created_at', { ascending: false });
  const el = document.getElementById('inboxList');
  if (error) { el.innerHTML = `<div class="error-text">${error.message}</div>`; return; }
  const pending = data.filter(i => !i.reviewed), done = data.filter(i => i.reviewed);
  el.innerHTML = (pending.length === 0 ? `<div class="empty">Inbox zero.</div>` :
    pending.map(i => `<div class="list-item">
      <div class="list-item-main"><div style="font-size:12.5px;">${escapeHtml(i.content)}</div>${i.category ? `<div class="card-sub" style="margin-top:2px;">${escapeHtml(i.category)}</div>` : ''}</div>
      <button class="icon-btn" data-review="${i.id}" title="Mark reviewed">✓</button>
      <button class="icon-btn" data-del="${i.id}" title="Delete">✕</button>
    </div>`).join(''))
    + (done.length ? `<div class="card-sub" style="margin:20px 0 8px;text-transform:uppercase;letter-spacing:.05em;">Reviewed</div>` +
      done.map(i => `<div class="list-item" style="opacity:.5;"><div class="list-item-main">${escapeHtml(i.content)}</div><button class="icon-btn" data-del="${i.id}">✕</button></div>`).join('') : '');
  el.querySelectorAll('[data-review]').forEach(b => b.addEventListener('click', async () => { await db.from('inbox_items').update({ reviewed: true }).eq('id', b.dataset.review); loadInboxList(); }));
  el.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => { await db.from('inbox_items').delete().eq('id', b.dataset.del); loadInboxList(); }));
}

/* ============================================================
   PROJECTS
   ============================================================ */
const PROJECT_TABS = ['active', 'waiting', 'someday', 'archived'];
let projectTab = 'active';
async function renderProjectsPage() {
  root().innerHTML = `
    ${pageHeader('Projects', 'Fifth Zero and freelance, one portfolio', `<button class="btn btn-primary" id="newProjectBtn">+ New project</button>`)}
    <div style="display:flex;gap:6px;margin-bottom:16px;" id="projectTabs">
      ${PROJECT_TABS.map(t => `<button class="btn btn-tab ${t === projectTab ? 'active' : ''}" data-ptab="${t}">${t}</button>`).join('')}
    </div>
    <div id="projectForm"></div>
    <div id="projectList" class="loading">Loading…</div>`;

  document.querySelectorAll('[data-ptab]').forEach(b => b.addEventListener('click', () => { projectTab = b.dataset.ptab; renderProjectsPage(); }));
  document.getElementById('newProjectBtn').addEventListener('click', () => showProjectForm(null));
  loadProjectList();
}
function showProjectForm(existing) {
  document.getElementById('projectForm').innerHTML = `
    <form class="form-card" id="pForm">
      <div class="form-row">
        <div class="field"><label>Name</label><input id="pName" value="${existing ? escapeHtml(existing.name) : ''}" required /></div>
        <div class="field"><label>Client</label><input id="pClient" value="${existing ? escapeHtml(existing.client || '') : ''}" /></div>
      </div>
      <div class="form-row">
        <div class="field"><label>Status</label><select id="pStatus">${PROJECT_TABS.map(t => `<option value="${t}" ${existing && existing.status === t ? 'selected' : (!existing && t === projectTab ? 'selected' : '')}>${t}</option>`).join('')}</select></div>
        <div class="field"><label>Progress (%)</label><input type="number" min="0" max="100" id="pProgress" value="${existing ? existing.progress : 0}" /></div>
      </div>
      <div class="field"><label>Next task</label><input id="pNext" value="${existing ? escapeHtml(existing.next_task || '') : ''}" /></div>
      <div class="field"><label>Deadline</label><input id="pDeadline" value="${existing ? escapeHtml(existing.deadline || '') : ''}" placeholder="e.g. Aug 4" /></div>
      <div class="error-text" id="pError"></div>
      <div style="display:flex;gap:8px;"><button class="btn btn-primary">${existing ? 'Save changes' : 'Add project'}</button><button type="button" class="btn btn-ghost" id="pCancel">Cancel</button></div>
    </form>`;
  document.getElementById('pCancel').addEventListener('click', () => { document.getElementById('projectForm').innerHTML = ''; });
  document.getElementById('pForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('pName').value,
      client: document.getElementById('pClient').value,
      status: document.getElementById('pStatus').value,
      progress: Number(document.getElementById('pProgress').value),
      next_task: document.getElementById('pNext').value,
      deadline: document.getElementById('pDeadline').value,
    };
    const { error } = existing ? await db.from('projects').update(payload).eq('id', existing.id) : await db.from('projects').insert(payload);
    if (error) { document.getElementById('pError').textContent = error.message; return; }
    document.getElementById('projectForm').innerHTML = '';
    renderProjectsPage();
  });
}
async function loadProjectList() {
  const { data, error } = await db.from('projects').select('*').order('created_at', { ascending: false });
  const el = document.getElementById('projectList');
  if (error) { el.innerHTML = `<div class="error-text">${error.message}</div>`; return; }
  const filtered = data.filter(p => p.status === projectTab);
  el.innerHTML = filtered.length === 0 ? `<div class="empty">No ${projectTab} projects.</div>` :
    filtered.map(p => `<div class="list-item" style="align-items:flex-start;">
      <div class="list-item-main">
        <div class="card-title">${escapeHtml(p.name)}</div><div class="card-sub">${escapeHtml(p.client || '')}</div>
        ${p.next_task ? `<div class="card-sub" style="margin-top:4px;">${escapeHtml(p.next_task)}</div>` : ''}
        <div style="height:3px;background:rgba(255,255,255,0.08);border-radius:3px;margin-top:8px;overflow:hidden;"><div style="height:100%;width:${p.progress}%;background:var(--white);"></div></div>
      </div>
      <span class="card-sub">${escapeHtml(p.deadline || '')}</span>
      <button class="icon-btn" data-edit="${p.id}" title="Edit">✎</button>
      <button class="icon-btn" data-del="${p.id}" title="Delete">✕</button>
    </div>`).join('');
  el.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => showProjectForm(data.find(p => p.id === b.dataset.edit))));
  el.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => { if (confirm('Delete this project?')) { await db.from('projects').delete().eq('id', b.dataset.del); loadProjectList(); } }));
}

/* ============================================================
   CLIENTS
   ============================================================ */
async function renderClientsPage() {
  root().innerHTML = `
    ${pageHeader('Clients', 'Every relationship that generates work', `<button class="btn btn-primary" id="newClientBtn">+ New client</button>`)}
    <div id="clientForm"></div>
    <div id="clientList" class="loading">Loading…</div>`;
  document.getElementById('newClientBtn').addEventListener('click', () => showClientForm(null));
  loadClientList();
}
function showClientForm(existing) {
  document.getElementById('clientForm').innerHTML = `
    <form class="form-card" id="cForm">
      <div class="form-row">
        <div class="field"><label>Name</label><input id="cName" value="${existing ? escapeHtml(existing.name) : ''}" required /></div>
        <div class="field"><label>Org</label><input id="cOrg" value="${existing ? escapeHtml(existing.org || '') : ''}" /></div>
      </div>
      <div class="form-row">
        <div class="field"><label>Status</label><select id="cStatus">
          ${['active', 'prospect', 'past'].map(s => `<option value="${s}" ${existing && existing.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select></div>
        <div class="field"><label>Tag</label><select id="cTag">
          ${['HOT', 'WARM', 'COOL'].map(t => `<option value="${t}" ${existing && existing.tag === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select></div>
      </div>
      <div class="field"><label>Note</label><textarea id="cNote" rows="2">${existing ? escapeHtml(existing.note || '') : ''}</textarea></div>
      <div class="field"><label>Category</label><input id="cCategory" value="${existing ? escapeHtml(existing.category || '') : ''}" /></div>
      <div class="error-text" id="cError"></div>
      <div style="display:flex;gap:8px;"><button class="btn btn-primary">${existing ? 'Save changes' : 'Add client'}</button><button type="button" class="btn btn-ghost" id="cCancel">Cancel</button></div>
    </form>`;
  document.getElementById('cCancel').addEventListener('click', () => { document.getElementById('clientForm').innerHTML = ''; });
  document.getElementById('cForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('cName').value, org: document.getElementById('cOrg').value,
      status: document.getElementById('cStatus').value, tag: document.getElementById('cTag').value,
      note: document.getElementById('cNote').value, category: document.getElementById('cCategory').value,
    };
    const { error } = existing ? await db.from('clients').update(payload).eq('id', existing.id) : await db.from('clients').insert(payload);
    if (error) { document.getElementById('cError').textContent = error.message; return; }
    document.getElementById('clientForm').innerHTML = '';
    loadClientList();
  });
}
async function loadClientList() {
  const { data, error } = await db.from('clients').select('*').order('created_at', { ascending: false });
  const el = document.getElementById('clientList');
  if (error) { el.innerHTML = `<div class="error-text">${error.message}</div>`; return; }
  el.innerHTML = data.length === 0 ? `<div class="empty">No clients yet.</div>` :
    data.map(c => `<div class="list-item">
      <div class="list-item-main"><div class="card-title">${escapeHtml(c.name)} ${c.org ? `<span class="card-sub">· ${escapeHtml(c.org)}</span>` : ''}</div>
      ${c.note ? `<div class="card-sub" style="margin-top:2px;">${escapeHtml(c.note)}</div>` : ''}</div>
      <span class="badge ${c.tag === 'HOT' ? 'badge-urgent' : c.tag === 'WARM' ? '' : 'badge-muted'}">${c.tag}</span>
      <button class="icon-btn" data-edit="${c.id}" title="Edit">✎</button>
      <button class="icon-btn" data-del="${c.id}" title="Delete">✕</button>
    </div>`).join('');
  el.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => showClientForm(data.find(c => c.id === b.dataset.edit))));
  el.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => { if (confirm('Delete this client?')) { await db.from('clients').delete().eq('id', b.dataset.del); loadClientList(); } }));
}

/* ============================================================
   FINANCE / INVOICES
   ============================================================ */
async function renderFinancePage() {
  root().innerHTML = `
    ${pageHeader('Finance', 'Business health, live from Supabase', `<button class="btn btn-primary" id="newInvoiceBtn">+ New invoice</button>`)}
    <div class="form-row" style="grid-template-columns:1fr 1fr 1fr;margin-bottom:16px;" id="financeTotals"></div>
    <div id="invoiceForm"></div>
    <div id="invoiceList" class="loading">Loading…</div>`;
  document.getElementById('newInvoiceBtn').addEventListener('click', () => showInvoiceForm(null));
  loadInvoiceList();
}
function showInvoiceForm(existing) {
  document.getElementById('invoiceForm').innerHTML = `
    <form class="form-card" id="iForm">
      <div class="form-row">
        <div class="field"><label>Client</label><input id="iClient" value="${existing ? escapeHtml(existing.client) : ''}" required /></div>
        <div class="field"><label>Amount ($)</label><input type="number" step="0.01" id="iAmount" value="${existing ? existing.amount : ''}" required /></div>
      </div>
      <div class="form-row">
        <div class="field"><label>Status</label><select id="iStatus">
          ${['pending', 'paid', 'overdue'].map(s => `<option value="${s}" ${existing && existing.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select></div>
        <div class="field"><label>Due date</label><input type="date" id="iDue" value="${existing ? existing.due_date || '' : ''}" /></div>
      </div>
      <div class="error-text" id="iError"></div>
      <div style="display:flex;gap:8px;"><button class="btn btn-primary">${existing ? 'Save changes' : 'Add invoice'}</button><button type="button" class="btn btn-ghost" id="iCancel">Cancel</button></div>
    </form>`;
  document.getElementById('iCancel').addEventListener('click', () => { document.getElementById('invoiceForm').innerHTML = ''; });
  document.getElementById('iForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      client: document.getElementById('iClient').value, amount: Number(document.getElementById('iAmount').value),
      status: document.getElementById('iStatus').value, due_date: document.getElementById('iDue').value || null,
    };
    const { error } = existing ? await db.from('invoices').update(payload).eq('id', existing.id) : await db.from('invoices').insert(payload);
    if (error) { document.getElementById('iError').textContent = error.message; return; }
    document.getElementById('invoiceForm').innerHTML = '';
    loadInvoiceList();
  });
}
async function loadInvoiceList() {
  const { data, error } = await db.from('invoices').select('*').order('due_date', { ascending: true });
  const listEl = document.getElementById('invoiceList');
  const totalsEl = document.getElementById('financeTotals');
  if (error) { listEl.innerHTML = `<div class="error-text">${error.message}</div>`; return; }
  const outstanding = data.filter(i => i.status !== 'paid').reduce((s, i) => s + Number(i.amount), 0);
  const paid = data.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);
  const overdue = data.filter(i => i.status === 'overdue').reduce((s, i) => s + Number(i.amount), 0);
  totalsEl.innerHTML = `
    <div class="card"><div class="card-sub">Outstanding</div><div class="card-value">$${outstanding.toLocaleString()}</div></div>
    <div class="card"><div class="card-sub">Paid</div><div class="card-value">$${paid.toLocaleString()}</div></div>
    <div class="card"><div class="card-sub" style="display:flex;align-items:center;gap:5px;"><span class="dot"></span>Overdue</div><div class="card-value">$${overdue.toLocaleString()}</div></div>`;
  listEl.innerHTML = data.length === 0 ? `<div class="empty">No invoices yet.</div>` :
    data.map(inv => `<div class="list-item">
      <div class="list-item-main"><div class="card-title">${escapeHtml(inv.client)}</div><div class="card-sub">Due ${inv.due_date || '—'}</div></div>
      <span>$${Number(inv.amount).toLocaleString()}</span>
      <span class="badge ${inv.status === 'overdue' ? 'badge-urgent' : inv.status === 'paid' ? 'badge-filled' : ''}">${inv.status}</span>
      ${inv.status !== 'paid' ? `<button class="icon-btn" data-paid="${inv.id}" title="Mark paid">✓</button>` : ''}
      <button class="icon-btn" data-edit="${inv.id}" title="Edit">✎</button>
      <button class="icon-btn" data-del="${inv.id}" title="Delete">✕</button>
    </div>`).join('');
  listEl.querySelectorAll('[data-paid]').forEach(b => b.addEventListener('click', async () => { await db.from('invoices').update({ status: 'paid' }).eq('id', b.dataset.paid); loadInvoiceList(); }));
  listEl.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => showInvoiceForm(data.find(i => i.id === b.dataset.edit))));
  listEl.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => { if (confirm('Delete this invoice?')) { await db.from('invoices').delete().eq('id', b.dataset.del); loadInvoiceList(); } }));
}

/* ============================================================
   JOURNAL
   ============================================================ */
async function renderJournalPage() {
  root().innerHTML = `
    ${pageHeader('Journal', 'Reflection space, saved to your account')}
    <form class="form-card surface-light" id="journalForm">
      <textarea id="journalContent" rows="3" placeholder="Write today's entry…" style="width:100%;background:rgba(10,10,10,0.03);border:1px solid var(--border-on-light);border-radius:6px;padding:10px;font-family:var(--font-body);font-size:13px;color:var(--black);"></textarea>
      <div class="error-text" id="journalError"></div>
      <div style="display:flex;justify-content:flex-end;margin-top:8px;"><button class="btn btn-primary">Save entry</button></div>
    </form>
    <div id="journalList" class="loading">Loading…</div>`;
  document.getElementById('journalForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = document.getElementById('journalContent').value.trim();
    if (!content) return;
    const { error } = await db.from('journal_entries').insert({ content });
    if (error) { document.getElementById('journalError').textContent = error.message; return; }
    e.target.reset();
    loadJournalList();
  });
  loadJournalList();
}
async function loadJournalList() {
  const { data, error } = await db.from('journal_entries').select('*').order('created_at', { ascending: false });
  const el = document.getElementById('journalList');
  if (error) { el.innerHTML = `<div class="error-text">${error.message}</div>`; return; }
  el.innerHTML = data.length === 0 ? `<div class="empty">No entries yet.</div>` :
    data.map(j => `<div class="list-item surface-light" style="align-items:flex-start;">
      <div class="list-item-main"><div class="card-sub" style="margin-bottom:4px;">${new Date(j.created_at).toLocaleDateString()}</div><div style="font-family:var(--font-body);font-size:13px;color:var(--black);">${escapeHtml(j.content)}</div></div>
      <button class="icon-btn" data-del="${j.id}" title="Delete">✕</button>
    </div>`).join('');
  el.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => { if (confirm('Delete this entry?')) { await db.from('journal_entries').delete().eq('id', b.dataset.del); loadJournalList(); } }));
}

/* ---------------- ROUTER ---------------- */
const RENDERERS = {
  inbox: renderInboxPage,
  projects: renderProjectsPage,
  clients: renderClientsPage,
  finance: renderFinancePage,
  journal: renderJournalPage,
};
