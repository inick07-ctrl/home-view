export const $ = (s, el = document) => el.querySelector(s);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export async function api(path, { method = 'GET', body } = {}) {
  const opt = { method, credentials: 'same-origin', headers: {} };
  if (body !== undefined) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
  const r = await fetch('/api/' + path, opt);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(data.error || `Request failed (${r.status})`); e.status = r.status; throw e; }
  return data;
}
export async function me() { try { return (await api('auth/me')).user; } catch { return null; } }
export const LOGO = '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M4.5 23L15.2 8.5L19.6 14.4L13.2 23H4.5Z" fill="#DFB974"/><path d="M17.8 18.2L21.5 13.2L27.5 23H21.2L17.8 18.2Z" fill="#F4F1EA"/></svg>';
export function header(user, active = '') {
  const h = document.createElement('header'); h.className = 'top';
  const link = (href, text, key) => `<a class="pill${active === key ? ' on' : ''}" href="${href}">${text}</a>`;
  h.innerHTML = `<a class="brand" href="${user ? '/dashboard' : '/'}">${LOGO}<span>PeakStead Designs</span></a><nav>${link('/examples', 'Examples', 'examples')}${link('/builder', 'Builder', 'builder')}${link('/freedraw', 'Free Draw', 'freedraw')}${user
    ? link('/dashboard', 'My projects', 'dashboard') + (user.admin ? link('/admin', 'Sponsors', 'admin') : '') + `<button class="pill" id="logoutBtn" title="${esc(user.email)}">Log out</button>`
    : link('/#login', 'Log in', 'login') + link('/#signup', 'Sign up', 'signup')}</nav>`;
  document.body.prepend(h);
  h.querySelector('#logoutBtn')?.addEventListener('click', async () => { await api('auth/logout', { method: 'POST', body: {} }).catch(() => {}); location.href = '/'; });
}
export function toast(msg, ms = 2200) {
  let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.style.display = 'block'; clearTimeout(t._h); t._h = setTimeout(() => { t.style.display = 'none'; }, ms);
}
export const fmtDate = (s) => { try { return new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return ''; } };
export const fmtSize = (n) => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
export function lightbox(src) {
  let lb = $('.lightbox'); if (!lb) { lb = document.createElement('div'); lb.className = 'lightbox'; lb.innerHTML = '<img alt="">'; lb.onclick = () => { lb.style.display = 'none'; }; document.body.appendChild(lb); }
  lb.querySelector('img').src = src; lb.style.display = 'flex';
}
// Renders a project's images + model status (shared by the owner page and the public share page).
export function renderGallery(el, project, fileUrl, { onDelete } = {}) {
  const imgs = project.files.filter(f => f.kind === 'image');
  if (!imgs.length) { el.innerHTML = '<p class="muted">No images yet.</p>'; return; }
  el.innerHTML = '';
  for (const f of imgs) {
    const fig = document.createElement('figure');
    const url = fileUrl(f);
    fig.innerHTML = f.contentType === 'application/pdf'
      ? `<a class="pdf" href="${url}" target="_blank" rel="noopener">📄 PDF</a>`
      : `<img loading="lazy" alt="${esc(f.name)}" src="${url}">`;
    fig.insertAdjacentHTML('beforeend', `<figcaption><span title="${esc(f.name)}">${esc(f.name)}</span>${onDelete ? '<button class="btn small danger" title="Delete">✕</button>' : ''}</figcaption>`);
    fig.querySelector('img')?.addEventListener('click', () => lightbox(url));
    fig.querySelector('button')?.addEventListener('click', () => onDelete(f));
    el.appendChild(fig);
  }
}

export function footer() {
  const html = `<a class="foot-brand" href="/">${LOGO}<span>PeakStead Designs</span></a> · <a href="/examples">Examples</a> · <a href="/builder">Builder</a> · <a href="/freedraw">Free Draw</a> · <a href="/advertise">Advertise with PeakStead Designs</a>`;
  const f = document.querySelector('footer');
  if (f) { f.classList.add('site-foot'); f.innerHTML = html; return f; }
  const el = document.createElement('footer'); el.className = 'site-foot'; el.innerHTML = html;
  document.body.appendChild(el); return el;
}
