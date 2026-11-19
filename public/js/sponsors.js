// Public sponsor helpers. Renders nothing unless an active sponsor exists.
export const SPONSOR_CATEGORIES = [
  { id: 'roofing', label: 'Roofing' },
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'hvac', label: 'HVAC' },
  { id: 'windows-doors', label: 'Windows / Doors' },
  { id: 'flooring', label: 'Flooring' },
  { id: 'appliances', label: 'Appliances' },
  { id: 'furniture', label: 'Furniture' },
  { id: 'other', label: 'Other' },
];

export function categoryLabel(id) {
  return SPONSOR_CATEGORIES.find(c => c.id === id)?.label || 'Other';
}

export async function loadActiveSponsors() {
  try {
    const r = await fetch('/api/sponsors', { credentials: 'same-origin' });
    if (!r.ok) return [];
    const data = await r.json();
    return Array.isArray(data.sponsors) ? data.sponsors : [];
  } catch {
    return [];
  }
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function logoImg(s) {
  if (!s.logo) return '';
  return `<img class="sp-logo" alt="" src="${esc(s.logo)}">`;
}

function companyLink(s, inner) {
  if (!s.link) return inner;
  return `<a href="${esc(s.link)}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
}

export function renderSponsorStrip(el, sponsors) {
  if (!el) return;
  const row = (sponsors || []).filter(s => s.strip);
  if (!row.length) { el.replaceChildren(); el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `<div class="sp-strip-h">Featured on Home View</div><div class="sp-strip-row">${row.map(s =>
    `<div class="sp-strip-item">${companyLink(s, `${logoImg(s)}<span>${esc(s.company)}</span>`)}</div>`
  ).join('')}</div>`;
}

export function renderFeaturedProducts(el, sponsors) {
  if (!el) return;
  const list = (sponsors || []).filter(s => s.featured);
  if (!list.length) { el.replaceChildren(); el.hidden = true; return; }
  const byCat = new Map();
  for (const s of list) {
    const id = s.category || 'other';
    if (!byCat.has(id)) byCat.set(id, []);
    byCat.get(id).push(s);
  }
  const sections = [];
  for (const cat of SPONSOR_CATEGORIES) {
    const group = byCat.get(cat.id);
    if (!group) continue;
    const cards = group.map(s => {
      const products = (s.products || []).filter(p => p && p.name);
      const prodHtml = products.length
        ? `<ul class="sp-products">${products.map(p => {
            const name = p.url
              ? `<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.name)}</a>`
              : esc(p.name);
            return `<li>${name}${p.blurb ? `<div class="muted">${esc(p.blurb)}</div>` : ''}</li>`;
          }).join('')}</ul>`
        : '';
      return `<div class="sp-card">${companyLink(s, `${logoImg(s)}<strong>${esc(s.company)}</strong>`)}${prodHtml}</div>`;
    }).join('');
    sections.push(`<h3>${esc(cat.label)}</h3>${cards}`);
  }
  if (!sections.length) { el.replaceChildren(); el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `<div class="sp-h">Featured products</div>${sections.join('')}`;
}

export async function mountSponsors({ strip, featured } = {}) {
  const sponsors = await loadActiveSponsors();
  if (strip) renderSponsorStrip(strip, sponsors);
  if (featured) renderFeaturedProducts(featured, sponsors);
}
