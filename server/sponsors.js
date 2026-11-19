import { BUILD_TYPE_IDS, sanitizeBuildType } from '../public/js/build-types.js';
import { SPONSOR_CATEGORIES } from '../public/js/sponsors.js';

export { BUILD_TYPE_IDS, sanitizeBuildType, SPONSOR_CATEGORIES };

const CAT_IDS = SPONSOR_CATEGORIES.map(c => c.id);

export function adminEmails() {
  const raw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '';
  return String(raw).split(/[,;\s]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
}

export function isAdmin(user) {
  if (!user || !user.email) return false;
  return adminEmails().includes(String(user.email).trim().toLowerCase());
}

export function contactEmail() {
  const c = (process.env.CONTACT_EMAIL || '').trim();
  return (c && c.includes('@')) ? c : '';
}

function clean(s, max) {
  return String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}

function cleanUrl(s, max = 500) {
  const u = clean(s, max);
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) throw Object.assign(new Error('Links must start with http:// or https://'), { status: 400 });
  return u;
}

export function sanitizeProduct(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const name = clean(raw.name, 120);
  if (!name) return null;
  const blurb = clean(raw.blurb, 400);
  const url = raw.url ? cleanUrl(raw.url, 500) : '';
  return { name, blurb, url };
}

export function sanitizeSponsor(raw, { partial = false, prev = {} } = {}) {
  const src = partial ? { ...prev, ...raw } : raw;
  if (!src || typeof src !== 'object') throw Object.assign(new Error('Invalid sponsor'), { status: 400 });
  const company = clean(src.company, 160);
  if (!company) throw Object.assign(new Error('Enter a company name'), { status: 400 });
  const cat = String(src.category || 'other').trim().toLowerCase();
  const category = CAT_IDS.includes(cat) ? cat : 'other';
  const products = Array.isArray(src.products) ? src.products.map(sanitizeProduct).filter(Boolean).slice(0, 20) : [];
  const placement = Array.isArray(src.placement) ? src.placement : (typeof src.placement === 'string' ? src.placement.split(/[,;\s]+/) : []);
  const featured = !!(src.featured ?? placement.includes('featured') ?? placement.includes('both'));
  const strip = !!(src.strip ?? placement.includes('strip') ?? placement.includes('both'));
  return {
    company,
    category,
    logo: src.logo ? cleanUrl(src.logo, 500) : '',
    link: src.link ? cleanUrl(src.link, 500) : '',
    products,
    active: !!src.active,
    featured,
    strip,
    notes: clean(src.notes, 2000),
  };
}

export function publicSponsor(s) {
  if (!s) return null;
  return {
    id: s.id,
    company: s.company,
    category: s.category,
    logo: s.logo || '',
    link: s.link || '',
    products: (s.products || []).map(p => ({ name: p.name, blurb: p.blurb || '', url: p.url || '' })),
    featured: !!s.featured,
    strip: !!s.strip,
  };
}

export function sanitizeInquiry(raw) {
  const name = clean(raw?.name, 120);
  const company = clean(raw?.company, 160);
  const email = clean(raw?.email, 200).toLowerCase();
  const category = clean(raw?.category, 40).toLowerCase();
  const message = clean(raw?.message, 4000);
  if (!name) throw Object.assign(new Error('Enter your name'), { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) throw Object.assign(new Error('Enter a valid email address'), { status: 400 });
  if (!message) throw Object.assign(new Error('Tell us a little about your interest'), { status: 400 });
  const cat = CAT_IDS.includes(category) ? category : (category ? 'other' : '');
  return { name, company, email, category: cat, message };
}

export { CAT_IDS };
