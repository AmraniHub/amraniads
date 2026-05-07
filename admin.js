/* ─────────────────────────────────────────────────────────
   AmraniAds — Admin Dashboard
   Change the password below, then redeploy.
   ───────────────────────────────────────────────────────── */

const ADMIN_PASSWORD  = 'AmraniAds2026';
const SESSION_KEY     = 'aa_admin_session';
const DRAFT_KEY       = 'aa_clients_draft';
const GH_CONFIG_KEY   = 'aa_gh_config';
const SESSION_HOURS   = 8;

// ── State ─────────────────────────────────────────────────

let clients      = [];
let activeSlug   = null;
let isNew        = false;
let activePanel  = 'clients'; // 'clients' | 'settings'

// ── Session ───────────────────────────────────────────────

function isLoggedIn() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY));
    return s && s.expires > Date.now();
  } catch { return false; }
}

function login(pw) {
  if (pw !== ADMIN_PASSWORD) return false;
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    expires: Date.now() + SESSION_HOURS * 3600 * 1000
  }));
  return true;
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  showScreen('login');
}

// ── Screens ───────────────────────────────────────────────

function showScreen(name) {
  document.getElementById('login-screen').style.display = name === 'login' ? 'flex'  : 'none';
  document.getElementById('dashboard').style.display    = name === 'dash'  ? 'grid'  : 'none';
}

// ── GitHub Config ─────────────────────────────────────────

function loadGHConfig() {
  try { return JSON.parse(localStorage.getItem(GH_CONFIG_KEY)) || {}; }
  catch { return {}; }
}

function saveGHConfig(cfg) {
  localStorage.setItem(GH_CONFIG_KEY, JSON.stringify(cfg));
}

function ghConfigured() {
  const cfg = loadGHConfig();
  return !!(cfg.token && cfg.repo);
}

// ── GitHub API — auto-deploy ──────────────────────────────

async function deployToGitHub() {
  const cfg = loadGHConfig();
  if (!cfg.token || !cfg.repo) {
    toast('Set up GitHub in Settings first.', 'error');
    openSettings();
    return false;
  }

  const content = JSON.stringify({ clients }, null, 2);
  const encoded = btoa(unescape(encodeURIComponent(content)));
  const apiBase = `https://api.github.com/repos/${cfg.repo}/contents/clients.json`;
  const headers = {
    'Authorization': `token ${cfg.token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };

  // Get current SHA (needed to update existing file)
  let sha = null;
  try {
    const res = await fetch(apiBase, { headers });
    if (res.ok) {
      const data = await res.json();
      sha = data.sha;
    }
  } catch {}

  // Commit the file
  const body = {
    message: `Update clients.json — ${new Date().toLocaleString('en-GB')}`,
    content: encoded,
    ...(sha ? { sha } : {})
  };

  const res = await fetch(apiBase, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error ${res.status}`);
  }

  return true;
}

// ── Data ──────────────────────────────────────────────────

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveDraft(data) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
}

async function fetchFromServer() {
  const res = await fetch('/clients.json?_=' + Date.now());
  if (!res.ok) throw new Error('Failed to fetch clients.json');
  const data = await res.json();
  return data.clients || [];
}

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ── Client list sidebar ───────────────────────────────────

function renderClientList() {
  const list = document.getElementById('client-list');

  if (!clients.length) {
    list.innerHTML = `<p style="font-size:0.78rem;color:#5A7A96;padding:1rem 0.85rem;">No clients yet. Click "+ New Client".</p>`;
    return;
  }

  list.innerHTML = clients.map(c => `
    <div class="client-item ${activeSlug === c.slug ? 'active' : ''}" data-slug="${c.slug}">
      <span class="client-item-dot ${c.active !== false ? 'live' : 'draft'}"></span>
      <div class="client-item-info">
        <div class="client-item-name">${escHtml(c.businessName)}</div>
        <div class="client-item-slug">/c/${escHtml(c.slug)}</div>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.client-item').forEach(el => {
    el.addEventListener('click', () => openClient(el.dataset.slug));
  });
}

// ── Form helpers ──────────────────────────────────────────

function openNewForm() {
  activePanel = 'clients';
  isNew = true; activeSlug = null;
  renderClientList(); showForm(); resetForm();
  document.getElementById('form-title').textContent    = 'New Client';
  document.getElementById('form-url').textContent      = '';
  document.getElementById('preview-btn').style.display = 'none';
  document.getElementById('sale-btn').style.display    = 'none';
  document.getElementById('delete-btn').style.display  = 'none';
}

function openClient(slug) {
  const c = clients.find(x => x.slug === slug);
  if (!c) return;
  activePanel = 'clients'; isNew = false; activeSlug = slug;
  renderClientList(); showForm(); populateForm(c);
  document.getElementById('form-title').textContent    = c.businessName;
  document.getElementById('form-url').textContent      = `amraniads.com/c/${c.slug}`;
  document.getElementById('preview-btn').style.display = '';
  document.getElementById('sale-btn').style.display    = '';
  document.getElementById('delete-btn').style.display  = '';
}

function showForm() {
  document.getElementById('empty-state').style.display       = 'none';
  document.getElementById('client-form-panel').style.display = '';
  document.getElementById('settings-panel').style.display    = 'none';
}

function hideForm() {
  document.getElementById('empty-state').style.display       = '';
  document.getElementById('client-form-panel').style.display = 'none';
  document.getElementById('settings-panel').style.display    = 'none';
  activeSlug = null; isNew = false;
  renderClientList();
}

function openSettings() {
  activePanel = 'settings'; activeSlug = null; isNew = false;
  renderClientList();
  document.getElementById('empty-state').style.display       = 'none';
  document.getElementById('client-form-panel').style.display = 'none';
  document.getElementById('settings-panel').style.display    = '';
  populateSettings();
}

function resetForm() {
  document.getElementById('client-form').reset();
  document.getElementById('f-original-slug').value = '';
  document.getElementById('f-color').value          = '#E87722';
  document.getElementById('f-color-text').value     = '#E87722';
  document.getElementById('f-active').checked       = true;
}

function populateForm(c) {
  document.getElementById('f-original-slug').value  = c.slug;
  document.getElementById('f-business-name').value  = c.businessName || '';
  document.getElementById('f-slug').value            = c.slug || '';
  document.getElementById('f-headline').value        = c.headline || '';
  document.getElementById('f-subheadline').value     = c.subheadline || '';
  document.getElementById('f-bullets').value         = (c.bullets || []).join('\n');
  document.getElementById('f-urgency').value         = c.urgency || '';
  document.getElementById('f-whatsapp').value        = c.whatsapp || '';
  document.getElementById('f-wa-btn-text').value     = c.whatsappButtonText || '';
  document.getElementById('f-wa-message').value      = c.whatsappMessage || '';
  document.getElementById('f-pixel-id').value        = c.pixelId || '';
  document.getElementById('f-price').value           = c.price || '';
  document.getElementById('f-color').value           = c.primaryColor || '#E87722';
  document.getElementById('f-color-text').value      = c.primaryColor || '#E87722';
  document.getElementById('f-active').checked        = c.active !== false;
}

function readForm() {
  const bullets = document.getElementById('f-bullets').value
    .split('\n').map(b => b.trim()).filter(Boolean).slice(0, 4);

  return {
    slug:               slugify(document.getElementById('f-slug').value),
    businessName:       document.getElementById('f-business-name').value.trim(),
    headline:           document.getElementById('f-headline').value.trim(),
    subheadline:        document.getElementById('f-subheadline').value.trim(),
    bullets,
    urgency:            document.getElementById('f-urgency').value.trim(),
    whatsapp:           document.getElementById('f-whatsapp').value.trim(),
    whatsappButtonText: document.getElementById('f-wa-btn-text').value.trim(),
    whatsappMessage:    document.getElementById('f-wa-message').value.trim(),
    pixelId:            document.getElementById('f-pixel-id').value.trim(),
    price:              Number(document.getElementById('f-price').value) || 0,
    currency:           'MAD',
    primaryColor:       document.getElementById('f-color-text').value.trim() || '#E87722',
    active:             document.getElementById('f-active').checked,
    createdAt:          new Date().toISOString().slice(0, 10)
  };
}

// ── Save / Delete ─────────────────────────────────────────

async function saveClient(e) {
  e.preventDefault();
  const data     = readForm();
  const origSlug = document.getElementById('f-original-slug').value;

  if (!data.slug || !data.businessName || !data.headline || !data.whatsapp) {
    toast('Please fill in all required fields.', 'error'); return;
  }

  if (clients.find(c => c.slug === data.slug && c.slug !== origSlug)) {
    toast(`Slug "${data.slug}" is already used.`, 'error'); return;
  }

  if (isNew) {
    clients.push(data);
  } else {
    const idx = clients.findIndex(c => c.slug === origSlug);
    if (idx !== -1) clients[idx] = data;
  }

  saveDraft(clients);
  activeSlug = data.slug; isNew = false;
  renderClientList(); populateForm(data);
  document.getElementById('form-title').textContent    = data.businessName;
  document.getElementById('form-url').textContent      = `amraniads.com/c/${data.slug}`;
  document.getElementById('f-original-slug').value     = data.slug;
  document.getElementById('preview-btn').style.display = '';
  document.getElementById('sale-btn').style.display    = '';
  document.getElementById('delete-btn').style.display  = '';

  if (ghConfigured()) {
    const btn = document.getElementById('save-btn');
    btn.textContent = 'Deploying...'; btn.disabled = true;
    try {
      await deployToGitHub();
      toast('Saved & deployed! Live on Vercel in ~30 seconds.', 'success');
    } catch (err) {
      toast(`Saved locally. Deploy failed: ${err.message}`, 'error');
    } finally {
      btn.textContent = 'Save & Deploy'; btn.disabled = false;
    }
  } else {
    toast('Client saved locally. Configure GitHub in Settings to auto-deploy.', 'success');
  }
}

function deleteClient() {
  const c = clients.find(x => x.slug === activeSlug);
  if (!c || !confirm(`Delete "${c.businessName}"? This cannot be undone.`)) return;

  clients = clients.filter(x => x.slug !== activeSlug);
  saveDraft(clients);
  hideForm(); renderClientList();

  if (ghConfigured()) {
    deployToGitHub()
      .then(() => toast(`"${c.businessName}" deleted & deployed.`, 'success'))
      .catch(() => toast(`Deleted locally. Manual deploy needed.`, 'error'));
  } else {
    toast(`"${c.businessName}" deleted.`, 'success');
  }
}

// ── Settings ──────────────────────────────────────────────

function populateSettings() {
  const cfg = loadGHConfig();
  document.getElementById('s-gh-repo').value  = cfg.repo  || 'AmraniHub/amraniads';
  document.getElementById('s-gh-token').value = cfg.token || '';
  updateDeployBadge();
}

function updateDeployBadge() {
  const badge  = document.getElementById('deploy-status');
  const saveBtn = document.getElementById('save-btn');
  if (!badge) return;
  if (ghConfigured()) {
    badge.textContent = '✓ Auto-deploy active';
    badge.className   = 'deploy-badge ok';
    if (saveBtn) saveBtn.textContent = 'Save & Deploy';
  } else {
    badge.textContent = '⚠ Not configured';
    badge.className   = 'deploy-badge warn';
    if (saveBtn) saveBtn.textContent = 'Save Client';
  }
}

function saveSettings(e) {
  e.preventDefault();
  const token = document.getElementById('s-gh-token').value.trim();
  const repo  = document.getElementById('s-gh-repo').value.trim();
  if (!token || !repo) { toast('Enter both repo and token.', 'error'); return; }
  saveGHConfig({ token, repo });
  updateDeployBadge();
  toast('GitHub settings saved — auto-deploy is active!', 'success');
}

async function testDeploy() {
  const btn = document.getElementById('test-deploy-btn');
  btn.textContent = 'Testing...'; btn.disabled = true;
  try {
    await deployToGitHub();
    toast('Test deploy succeeded! Check Vercel — live in ~30s.', 'success');
  } catch (err) {
    toast(`Deploy failed: ${err.message}`, 'error');
  } finally {
    btn.textContent = 'Test Deploy Now'; btn.disabled = false;
  }
}

// ── Export fallback ───────────────────────────────────────

function exportJSON() {
  const blob = new Blob([JSON.stringify({ clients }, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'clients.json'; a.click();
  URL.revokeObjectURL(url);
  toast('clients.json downloaded.', 'success');
}

// ── Preview & Track Sale ──────────────────────────────────

function previewClient() {
  if (activeSlug) window.open(`/c/${activeSlug}`, '_blank', 'noopener');
}

function trackSale() {
  if (!activeSlug) return;
  window.open(`/c/${activeSlug}?purchase=1`, '_blank', 'noopener');
  toast('Purchase event fired on client page.', 'success');
}

// ── Toast ─────────────────────────────────────────────────

let toastTimer;
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 4500);
}

// ── Utilities ─────────────────────────────────────────────

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function syncColorPicker() {
  const picker = document.getElementById('f-color');
  const text   = document.getElementById('f-color-text');
  picker.addEventListener('input', () => { text.value = picker.value; });
  text.addEventListener('input', () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(text.value.trim())) picker.value = text.value.trim();
  });
}

function syncSlug() {
  const nameInput = document.getElementById('f-business-name');
  const slugInput = document.getElementById('f-slug');
  let manual = false;
  nameInput.addEventListener('input', () => {
    if (!manual || !slugInput.value) slugInput.value = slugify(nameInput.value);
  });
  slugInput.addEventListener('input', () => {
    manual = slugInput.value.length > 0;
    slugInput.value = slugify(slugInput.value);
  });
}

// ── Init ──────────────────────────────────────────────────

async function initDashboard() {
  updateDeployBadge();
  const draft = loadDraft();
  if (draft) {
    clients = draft; renderClientList();
  } else {
    try { clients = await fetchFromServer(); renderClientList(); }
    catch { clients = []; renderClientList(); }
  }
}

async function init() {
  if (isLoggedIn()) { showScreen('dash'); await initDashboard(); }
  else { showScreen('login'); }

  document.getElementById('login-form').addEventListener('submit', e => {
    e.preventDefault();
    const pw = document.getElementById('password-input').value;
    if (login(pw)) {
      document.getElementById('login-error').style.display = 'none';
      showScreen('dash'); initDashboard();
    } else {
      document.getElementById('login-error').style.display = 'block';
      document.getElementById('password-input').value = '';
      document.getElementById('password-input').focus();
    }
  });

  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('new-client-btn').addEventListener('click', openNewForm);
  document.getElementById('empty-new-btn').addEventListener('click', openNewForm);
  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('export-btn').addEventListener('click', exportJSON);
  document.getElementById('preview-btn').addEventListener('click', previewClient);
  document.getElementById('sale-btn').addEventListener('click', trackSale);
  document.getElementById('delete-btn').addEventListener('click', deleteClient);
  document.getElementById('cancel-btn').addEventListener('click', hideForm);

  document.getElementById('sync-btn').addEventListener('click', async () => {
    try {
      clients = await fetchFromServer(); saveDraft(clients);
      renderClientList(); hideForm();
      toast('Synced from server.', 'success');
    } catch { toast('Could not sync from server.', 'error'); }
  });

  document.getElementById('client-form').addEventListener('submit', saveClient);
  document.getElementById('settings-form').addEventListener('submit', saveSettings);
  document.getElementById('test-deploy-btn').addEventListener('click', testDeploy);

  syncColorPicker();
  syncSlug();
}

init();
