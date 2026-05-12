// ── State ──────────────────────────────────────────────
let allKeys = [];
let currentView = 'keys';
let editingId = null;

// ── Service color buckets ───────────────────────────────
const SERVICE_COLORS = {
  openai: 'teal', anthropic: 'teal', claude: 'teal',
  rapidapi: 'gold', aws: 'gold', stripe: 'gold', github: 'gold',
  google: 'gold', vercel: 'gold', supabase: 'gold',
  twilio: 'coral', sendgrid: 'coral', firebase: 'coral',
};
function serviceColor(service) {
  const key = (service || '').toLowerCase().replace(/\s/g, '');
  for (const [k, v] of Object.entries(SERVICE_COLORS)) {
    if (key.includes(k)) return v;
  }
  const codes = ['teal','gold','coral'];
  return codes[service.charCodeAt(0) % 3];
}

// ── DOM Refs ────────────────────────────────────────────
const grid         = document.getElementById('keys-grid');
const search       = document.getElementById('search');
const sortSelect   = document.getElementById('sort-select');
const modalOverlay = document.getElementById('modal-overlay');
const revealOverlay = document.getElementById('reveal-overlay');
const toast        = document.getElementById('toast');

// ── Boot ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadKeys();
  bindEvents();
});

// ── Data ────────────────────────────────────────────────
async function loadKeys() {
  grid.innerHTML = '<div class="state-msg">Loading your vault…</div>';
  try {
    const res = await fetch('/api/keys');
    const data = await res.json();
    allKeys = data.keys || [];
    renderGrid();
  } catch {
    grid.innerHTML = '<div class="state-msg">Failed to load keys. Is your server running?</div>';
  }
}

async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const s = await res.json();
    document.getElementById('stat-total').textContent   = s.total;
    document.getElementById('stat-expired').textContent = s.expired;
    document.getElementById('stat-today').textContent   = s.used_today;
    document.getElementById('count-all').textContent    = s.total;
    document.getElementById('count-expired').textContent = s.expired;
  } catch {}
}

// ── Render ───────────────────────────────────────────────
function renderGrid() {
  const q    = search.value.toLowerCase();
  const sort = sortSelect.value;
  let keys   = [...allKeys];

  if (currentView === 'expired') {
    keys = keys.filter(k => k.expires_at && new Date(k.expires_at) < new Date());
  }
  if (q) {
    keys = keys.filter(k =>
      k.name.toLowerCase().includes(q) ||
      k.service.toLowerCase().includes(q) ||
      (k.tags || '').toLowerCase().includes(q) ||
      (k.note || '').toLowerCase().includes(q)
    );
  }
  keys.sort((a, b) => {
    if (sort === 'name')     return a.name.localeCompare(b.name);
    if (sort === 'service')  return a.service.localeCompare(b.service);
    if (sort === 'last_used') return (b.last_used || '').localeCompare(a.last_used || '');
    return b.created_at.localeCompare(a.created_at);
  });

  if (!keys.length) {
    grid.innerHTML = '<div class="state-msg">No keys found. Add your first one →</div>';
    return;
  }
  grid.innerHTML = keys.map(renderCard).join('');
}

function renderCard(k) {
  const isExpired = k.expires_at && new Date(k.expires_at) < new Date();
  const color     = serviceColor(k.service);
  const tags      = (k.tags || '').split(',').map(t => t.trim()).filter(Boolean);
  const lastUsed  = k.last_used ? `Used ${fmtDate(k.last_used)}` : 'Never used';
  let expiryHtml  = '';
  if (k.expires_at) {
    if (isExpired) {
      expiryHtml = `<span class="expiry-warn">Expired ${fmtDate(k.expires_at)}</span>`;
    } else {
      expiryHtml = `<span class="expiry-ok">Exp ${fmtDate(k.expires_at)}</span>`;
    }
  }

  return `
    <div class="key-card service-${color} ${isExpired ? 'expired' : ''}">
      <div class="card-header">
        <span class="service-badge ${color}">${esc(k.service)}${isExpired ? ' ⚠' : ''}</span>
        <div class="card-actions">
          <button class="action-btn" title="Reveal" onclick="revealKey(${k.id})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="action-btn" title="Edit" onclick="openEditModal(${k.id})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="action-btn del" title="Delete" onclick="deleteKey(${k.id})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </div>

      <div class="card-name">${esc(k.name)}</div>

      <div class="card-key-row">
        <span class="card-key-val">${esc(k.masked_value)}</span>
        <button class="copy-btn" onclick="copyKey(event, ${k.id})">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy
        </button>
      </div>

      ${tags.length ? `<div class="card-tags">${tags.map(t => `<span class="tag-pill">${esc(t)}</span>`).join('')}</div>` : ''}
      ${k.note ? `<p class="card-note">${esc(k.note)}</p>` : ''}

      <div class="card-meta">
        <span>${lastUsed}</span>
        ${expiryHtml}
      </div>
    </div>
  `;
}

// ── Copy ────────────────────────────────────────────────
async function copyKey(e, id) {
  e.stopPropagation();
  const btn = e.currentTarget;
  try {
    const res = await fetch(`/api/keys/${id}`);
    const key = await res.json();
    await navigator.clipboard.writeText(key.value);
    btn.innerHTML = '✓ Copied';
    setTimeout(() => {
      btn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
    }, 2000);
    showToast('Copied to clipboard', 'success');
    loadKeys();
  } catch { showToast('Copy failed', 'error'); }
}

// ── Reveal ───────────────────────────────────────────────
async function revealKey(id) {
  try {
    const res = await fetch(`/api/keys/${id}`);
    const key = await res.json();
    document.getElementById('reveal-value').textContent = key.value;
    revealOverlay.classList.remove('hidden');
    loadKeys();
  } catch { showToast('Failed to reveal key', 'error'); }
}
window.revealKey = revealKey;

document.getElementById('reveal-close').onclick = () => revealOverlay.classList.add('hidden');
document.getElementById('copy-reveal').onclick = async () => {
  const val = document.getElementById('reveal-value').textContent;
  await navigator.clipboard.writeText(val);
  showToast('Copied!', 'success');
};
revealOverlay.addEventListener('click', e => { if (e.target === revealOverlay) revealOverlay.classList.add('hidden'); });

// ── Add Modal ────────────────────────────────────────────
function openAddModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Add New Key';
  ['f-name','f-service','f-value','f-tags','f-note','f-expires'].forEach(id => {
    document.getElementById(id).value = '';
  });
  modalOverlay.classList.remove('hidden');
  document.getElementById('f-name').focus();
}

window.openEditModal = async (id) => {
  const key = allKeys.find(k => k.id == id);
  if (!key) return;
  editingId = id;
  document.getElementById('modal-title').textContent = 'Edit Key';
  document.getElementById('f-name').value    = key.name || '';
  document.getElementById('f-service').value = key.service || '';
  document.getElementById('f-tags').value    = key.tags || '';
  document.getElementById('f-note').value    = key.note || '';
  document.getElementById('f-expires').value = key.expires_at ? key.expires_at.slice(0,10) : '';
  try {
    const res = await fetch(`/api/keys/${id}`);
    const full = await res.json();
    document.getElementById('f-value').value = full.value || '';
  } catch {}
  modalOverlay.classList.remove('hidden');
};

document.getElementById('open-modal-btn').onclick = openAddModal;
document.getElementById('modal-close').onclick  = () => modalOverlay.classList.add('hidden');
document.getElementById('modal-cancel').onclick = () => modalOverlay.classList.add('hidden');
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) modalOverlay.classList.add('hidden'); });

document.getElementById('toggle-vis').onclick = () => {
  const inp = document.getElementById('f-value');
  inp.type = inp.type === 'password' ? 'text' : 'password';
};

document.getElementById('modal-save').onclick = async () => {
  const name      = document.getElementById('f-name').value.trim();
  const service   = document.getElementById('f-service').value.trim();
  const value     = document.getElementById('f-value').value.trim();
  const tags      = document.getElementById('f-tags').value.trim();
  const note      = document.getElementById('f-note').value.trim();
  const expires_at = document.getElementById('f-expires').value || null;

  if (!name || !service || !value) {
    showToast('Name, service, and key value are required', 'error');
    return;
  }

  try {
    if (editingId) {
      await fetch(`/api/keys/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, service, value, tags, note, expires_at }),
      });
      showToast('Key updated', 'success');
    } else {
      await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, service, value, tags, note, expires_at }),
      });
      showToast('Key saved to vault', 'success');
    }
    modalOverlay.classList.add('hidden');
    loadKeys();
    loadStats();
  } catch { showToast('Failed to save key', 'error'); }
};

// ── Delete ───────────────────────────────────────────────
window.deleteKey = async (id) => {
  if (!confirm('Delete this key? This cannot be undone.')) return;
  await fetch(`/api/keys/${id}`, { method: 'DELETE' });
  showToast('Key deleted', 'success');
  loadKeys();
  loadStats();
};

// ── Nav ──────────────────────────────────────────────────
document.querySelectorAll('.sb-item').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.sb-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentView = btn.dataset.view;
    document.getElementById('view-title').textContent =
      currentView === 'expired' ? 'Expiring Keys' : 'All Keys';
    renderGrid();
  };
});

// ── Search + Sort ────────────────────────────────────────
function bindEvents() {
  search.addEventListener('input', renderGrid);
  sortSelect.addEventListener('change', renderGrid);
}

// ── Utils ────────────────────────────────────────────────
function esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}

let toastTimer;
function showToast(msg, type = '') {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3000);
}
