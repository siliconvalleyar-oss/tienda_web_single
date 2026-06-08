let toastTimer = null;

export function showToast(message, duration = 3000) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  if (toastTimer) clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.remove('is-visible');
  void toast.offsetWidth;
  toast.classList.add('is-visible');
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), duration);
}

export function setupMobileMenu() {
  const burgerBtn = document.getElementById('burgerBtn');
  const nav = document.getElementById('mainNav');
  const navLinks = nav.querySelectorAll('.header__link');

  function toggleMenu() {
    const isActive = burgerBtn.classList.toggle('is-active');
    nav.classList.toggle('is-open');
    burgerBtn.setAttribute('aria-expanded', isActive);
    document.body.style.overflow = isActive ? 'hidden' : '';
  }
  function closeMenu() {
    burgerBtn.classList.remove('is-active');
    nav.classList.remove('is-open');
    burgerBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  burgerBtn.addEventListener('click', toggleMenu);
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (nav.classList.contains('is-open')) closeMenu();
    });
  });
}

export function setupHeaderScroll() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('header--scrolled', window.scrollY > 20);
  });
}

export function setupActiveNavHighlight() {
  const navLinks = document.querySelectorAll('.header__link');
  const sections = [];

  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      const section = document.querySelector(href);
      if (section) sections.push({ link, section });
    }
  });

  function highlightLink() {
    let currentId = '';
    sections.forEach(({ section }) => {
      if (section.getBoundingClientRect().top <= window.innerHeight * 0.4) {
        currentId = section.getAttribute('id');
      }
    });
    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentId}`) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', highlightLink, { passive: true });
  highlightLink();
}

export function setupScrollTopButton() {
  const btn = document.getElementById('scrollTopBtn');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('is-visible', window.scrollY > 600);
  });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

export function setupScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

  const mutationObserver = new MutationObserver(() => {
    document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => {
      observer.observe(el);
    });
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true });
}

export function setupNewsletterForm() {
  const form = document.getElementById('newsletterForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    if (email) {
      showToast(`📧 ¡Gracias! Te enviamos el descuento a ${email}`);
      form.reset();
    }
  });
}
