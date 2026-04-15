/* LOAD COMPONENTS */
async function loadComponents() {
  const components = ['navbar', 'hero', 'about', 'schedule', 'speakers', 'register', 'footer', 'modal', 'toast'];
  const app = document.getElementById('app');
  for (const comp of components) {
    try {
      const res = await fetch(`components/${comp}.html`);
      if (!res.ok) throw new Error(`Failed to load ${comp}`);
      const html = await res.text();
      app.insertAdjacentHTML('beforeend', html);
    } catch (error) {
      console.error(`Error loading component ${comp}:`, error);
    }
  }
}

/* STATE */
const SUPPORTED_LANGS = ['en', 'vi'];
let lang = localStorage.getItem('lang') || 'en';
let translations = {};

/* LOAD TRANSLATIONS */
async function loadLang(nextLang) {
  try {
    const targetLang = SUPPORTED_LANGS.includes(nextLang) ? nextLang : 'en';
    const res = await fetch(`lang/${targetLang}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    translations = await res.json();
    lang = targetLang;
    localStorage.setItem('lang', targetLang);
    applyTranslations();
    renderDynamic();
    updateLangButtons();
  } catch (error) {
    console.warn('Failed to load language file:', error);
  }
}

/* GET NESTED KEY */
function t(key) {
  return key.split('.').reduce((obj, segment) => (obj && obj[segment] !== undefined ? obj[segment] : key), translations);
}

/* APPLY STATIC TEXT */
function applyTranslations() {
  document.documentElement.lang = t('meta.htmlLang') || lang;
  document.title = t('meta.title');

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const value = t(key);
    if (typeof value === 'string') el.textContent = value;
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const value = t(key);
    if (typeof value === 'string') el.placeholder = value;
  });
}

/* RENDER DYNAMIC SECTIONS */
function renderDynamic() {
  renderSchedule();
  renderSpeakers();
  renderRoleOptions();
  renderFooterLinks();
}

/* SCHEDULE */
function renderSchedule() {
  const items = t('schedule.items');
  if (!Array.isArray(items)) return;

  const container = document.getElementById('schedule-list');
  container.innerHTML = items.map((item, index) => `
    <div class="schedule-item fade-up stagger-${Math.min(index + 1, 6)}">
      <div class="time-col">${item.time}</div>
      <div class="dot-col">
        <div class="timeline-dot"></div>
      </div>
      <div class="content-col">
        <div class="flex flex-wrap items-center gap-3 mb-2">
          <h4 style="font-size: 1rem; font-weight: 700; color: #e2e8f0;">${item.title}</h4>
          <span class="tag-pill tag-${item.tagKey || 'talk'}">${item.tag}</span>
        </div>
        <p style="font-size: 0.875rem; color: #64748b; line-height: 1.6;">${item.desc}</p>
      </div>
    </div>
  `).join('');

  reObserve();
}

/* SPEAKERS */
function renderSpeakers() {
  const items = t('speakers.items');
  if (!Array.isArray(items)) return;

  const container = document.getElementById('speakers-grid');
  container.innerHTML = items.map((speaker, index) => `
    <div class="speaker-card fade-up stagger-${Math.min(index + 1, 6)}">
      <div class="avatar ${speaker.color}">
        ${speaker.initials}
        <div class="avatar-ring"></div>
      </div>
      <h4 style="font-size: 1rem; font-weight: 700; color: #fff; margin-bottom: 4px;">${speaker.name}</h4>
      <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 12px;">${speaker.role}</p>
      <div style="font-size: 0.78rem; font-weight: 600; color: var(--accent); background: rgba(56,189,248,0.08); border: 1px solid rgba(56,189,248,0.2); padding: 5px 12px; border-radius: 100px; display: inline-block;">${speaker.topic}</div>
    </div>
  `).join('');

  reObserve();
}

/* ROLE OPTIONS */
function renderRoleOptions() {
  const roles = t('register.form.roles');
  const placeholder = t('register.form.rolePlaceholder');
  if (!Array.isArray(roles)) return;

  ['f-role', 'm-role'].forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;

    select.innerHTML = `<option value="" disabled>${placeholder}</option>` +
      roles.map(role => `<option value="${role}">${role}</option>`).join('');
  });
}

/* FOOTER LINKS */
function renderFooterLinks() {
  const links = t('footer.links');
  if (!Array.isArray(links)) return;

  document.getElementById('footer-links').innerHTML = links.map(link =>
    `<a href="${link.href || '#'}" class="nav-link" style="font-size: 0.85rem;">${link.label || ''}</a>`
  ).join('');
}

/* LANGUAGE SWITCH */
function setLang(nextLang) {
  loadLang(nextLang);
}

function updateLangButtons() {
  ['btn-en', 'btn-en-m'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', lang === 'en');
  });

  ['btn-vi', 'btn-vi-m'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', lang === 'vi');
  });
}

/* NAVBAR SCROLL */
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 60);
});

/* COUNTDOWN */
const eventDate = new Date('2026-04-26T09:00:00');

function updateCountdown() {
  const now = new Date();
  const diff = eventDate - now;

  if (diff <= 0) {
    ['cd-days', 'cd-hours', 'cd-minutes', 'cd-seconds'].forEach(id => {
      document.getElementById(id).textContent = '00';
    });
    return;
  }

  const pad = value => String(Math.floor(value)).padStart(2, '0');
  document.getElementById('cd-days').textContent = pad(diff / 86400000);
  document.getElementById('cd-hours').textContent = pad((diff % 86400000) / 3600000);
  document.getElementById('cd-minutes').textContent = pad((diff % 3600000) / 60000);
  document.getElementById('cd-seconds').textContent = pad((diff % 60000) / 1000);
}

/* INTERSECTION OBSERVER */
function reObserve() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.fade-up, .fade-left').forEach(el => {
    if (!el.classList.contains('visible')) observer.observe(el);
  });
}

/* MODAL */
function openModal() {
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function closeModalOutside(event) {
  if (event.target === document.getElementById('modal-overlay')) closeModal();
}

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeModal();
});

/* TOAST */
function showToast(type, message) {
  const toast = document.getElementById('toast');
  const inner = document.getElementById('toast-inner');
  const icon = document.getElementById('toast-icon');
  const msg = document.getElementById('toast-msg');

  inner.className = `toast-inner toast-${type}`;
  icon.className = `toast-icon-${type}`;
  icon.textContent = type === 'success' ? '?' : '?';
  msg.textContent = message;

  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

/* FORM VALIDATION */
function validateForm(ids) {
  let valid = true;

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    if (!el.value.trim()) {
      el.classList.add('error');
      valid = false;
    } else {
      el.classList.remove('error');
    }
  });

  return valid;
}

/* INLINE FORM SUBMIT */
function submitForm(event) {
  event.preventDefault();

  if (!validateForm(['f-name', 'f-email', 'f-company', 'f-role'])) {
    showToast('error', t('toast.error'));
    return;
  }

  const btn = document.getElementById('submit-btn');
  const text = document.getElementById('submit-text');
  btn.disabled = true;
  text.textContent = t('register.form.submitting');

  setTimeout(() => {
    btn.disabled = false;
    text.textContent = t('register.form.submit');
    document.getElementById('reg-form').reset();
    showToast('success', t('toast.success'));
  }, 1400);
}

/* MODAL FORM SUBMIT */
function submitModalForm(event) {
  event.preventDefault();

  if (!validateForm(['m-name', 'm-email', 'm-company', 'm-role'])) {
    showToast('error', t('toast.error'));
    return;
  }

  const btn = document.getElementById('modal-submit-btn');
  const text = document.getElementById('modal-submit-text');
  btn.disabled = true;
  text.textContent = t('register.form.submitting');

  setTimeout(() => {
    btn.disabled = false;
    text.textContent = t('register.form.submit');
    document.getElementById('modal-form').reset();
    closeModal();
    showToast('success', t('toast.success'));
  }, 1400);
}

/* MOBILE MENU */
function toggleMenu() {
  const menu = document.getElementById('mobile-menu');
  const iconOpen = document.getElementById('menu-icon-open');
  const iconClose = document.getElementById('menu-icon-close');
  const isOpen = menu.classList.toggle('open');

  iconOpen.classList.toggle('hidden', isOpen);
  iconClose.classList.toggle('hidden', !isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

/* ERROR CLEAR ON INPUT */
document.addEventListener('input', event => {
  if (event.target.classList.contains('form-input')) {
    event.target.classList.remove('error');
  }
});

/* INIT */
window.addEventListener('DOMContentLoaded', async () => {
  await loadComponents();
  loadLang(lang);
  reObserve();
  setInterval(updateCountdown, 1000);
  updateCountdown();
});