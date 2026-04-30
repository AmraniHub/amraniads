/* AmraniAds — main.js */

const WA_URL = 'https://wa.me/212627716149';

/* ── Nav scroll behavior ── */
const navbar = document.getElementById('navbar');
const scrollIndicator = document.getElementById('scroll-indicator');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
  if (scrollIndicator) scrollIndicator.classList.toggle('hidden', window.scrollY > 120);
}, { passive: true });

/* ── Hero entry animations ── */
document.querySelectorAll('.animate-entry').forEach(el => {
  const delay = el.style.getPropertyValue('--delay') || '0ms';
  el.style.transitionDelay = delay;
  requestAnimationFrame(() => setTimeout(() => el.classList.add('visible'), 60));
});

/* ── Mobile nav ── */
const hamburger    = document.getElementById('hamburger');
const mobileNav    = document.getElementById('mobile-nav');
const mobileClose  = document.getElementById('mobile-nav-close');

function openMobileNav() {
  mobileNav.classList.add('open');
  hamburger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}
function closeMobileNav() {
  mobileNav.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', openMobileNav);
mobileClose.addEventListener('click', closeMobileNav);

document.querySelectorAll('.mobile-nav-link').forEach(link => {
  link.addEventListener('click', closeMobileNav);
});

mobileNav.addEventListener('click', e => {
  if (e.target === mobileNav) closeMobileNav();
});

/* ── Pricing toggle ── */
const toggleBtns = document.querySelectorAll('.toggle-btn');
const priceAmounts = document.querySelectorAll('.price-amount');
let activePlan = 'regular';

toggleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const plan = btn.dataset.plan;
    if (plan === activePlan) return;
    activePlan = plan;

    toggleBtns.forEach(b => b.classList.toggle('active', b.dataset.plan === plan));

    priceAmounts.forEach(el => {
      el.classList.add('fade');
      setTimeout(() => {
        el.textContent = el.dataset[plan];
        el.classList.remove('fade');
      }, 180);
    });
  });
});

/* ── FAQ accordion ── */
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item   = btn.closest('.faq-item');
    const answer = item.querySelector('.faq-answer');
    const isOpen = item.classList.contains('open');

    /* Close all */
    document.querySelectorAll('.faq-item.open').forEach(openItem => {
      openItem.classList.remove('open');
      openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      openItem.querySelector('.faq-answer').style.maxHeight = '0';
    });

    if (!isOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});

/* ── Audit form submission ── */
const auditForm   = document.getElementById('audit-form');
const auditSubmit = document.getElementById('audit-submit');

auditForm.addEventListener('submit', e => {
  e.preventDefault();

  const url  = auditForm.store.value.trim();
  const name = auditForm.name.value.trim();
  const email = auditForm.email.value.trim();
  const wa   = auditForm.wa.value.trim();

  /* Basic validation */
  if (!url || !email || !wa) {
    const firstEmpty = [
      { val: url,   el: auditForm.store },
      { val: email, el: auditForm.email },
      { val: wa,    el: auditForm.wa },
    ].find(f => !f.val);
    if (firstEmpty) firstEmpty.el.focus();
    return;
  }

  auditSubmit.disabled = true;
  auditSubmit.textContent = 'Sending...';

  const message = `Bonjour! Je veux un audit gratuit de mon store.\nStore: ${url}\nNom: ${name}\nEmail: ${email}\nWhatsApp: ${wa}`;
  const waLink  = `${WA_URL}?text=${encodeURIComponent(message)}`;

  setTimeout(() => {
    window.open(waLink, '_blank');
    auditSubmit.textContent = 'Report Sent to WhatsApp ✓';
    auditSubmit.classList.add('sent');
  }, 1500);
});

/* ── Scroll animations (IntersectionObserver) ── */
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

/* ── Active nav link on scroll ── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionObserver.observe(s));
