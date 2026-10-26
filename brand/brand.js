/* ============================================================
   PERSONAL BRAND SITE — small progressive enhancements.
   The page is fully readable without this file.
   ============================================================ */

document.documentElement.classList.add('js');

/* ---------- nav: background on scroll + mobile menu ---------- */
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.textContent = open ? 'Close' : 'Menu';
});
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navLinks.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.textContent = 'Menu';
}));

/* ---------- availability: always shows next month ---------- */
const next = new Date();
next.setMonth(next.getMonth() + 1, 1);
document.getElementById('availMonth').textContent = next.toLocaleString('en', { month: 'long' });
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- work filters ---------- */
const chips = document.querySelectorAll('.chip');
const cards = document.querySelectorAll('#workGrid .card');
chips.forEach(chip => chip.addEventListener('click', () => {
  const f = chip.dataset.filter;
  chips.forEach(c => {
    c.classList.toggle('active', c === chip);
    c.setAttribute('aria-pressed', String(c === chip));
  });
  cards.forEach(card => card.classList.toggle('hidden', f !== 'all' && card.dataset.cat !== f));
}));

/* ---------- copy email ---------- */
const toast = document.getElementById('toast');
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}
document.getElementById('copyEmail').addEventListener('click', async (e) => {
  const email = e.currentTarget.dataset.email;
  try {
    await navigator.clipboard.writeText(email);
    showToast('Email copied');
  } catch {
    showToast(email);
  }
});

/* ---------- reveal on scroll ---------- */
const revealTargets = document.querySelectorAll('.section-head, .card, .service, .steps li, .about-photo, .about-body, .quote blockquote, .contact > *');
revealTargets.forEach(el => el.classList.add('reveal'));
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    }
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealTargets.forEach(el => io.observe(el));
} else {
  revealTargets.forEach(el => el.classList.add('in'));
}
