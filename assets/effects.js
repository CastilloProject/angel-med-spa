(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  document.querySelectorAll('.btn,.treatment>.text-link,.highlight-links a').forEach(control => {
    let frame;
    control.addEventListener('pointermove', event => {
      if (reducedMotion.matches || !finePointer.matches) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = control.getBoundingClientRect();
        control.style.setProperty('--glow-x', `${event.clientX - rect.left}px`);
        control.style.setProperty('--glow-y', `${event.clientY - rect.top}px`);
      });
    });
    control.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      control.style.removeProperty('--glow-x');
      control.style.removeProperty('--glow-y');
    });
  });
  const cards = [...document.querySelectorAll('.treatment')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  let activeFilter = 'all';
  function announce() {
    const count = cards.filter(card => !card.hidden).length;
    document.getElementById('filterStatus').textContent = document.documentElement.lang === 'en'
      ? `${count} treatment${count === 1 ? '' : 's'} shown` : `${count} tratamiento${count === 1 ? '' : 's'} disponible${count === 1 ? '' : 's'}`;
  }
  filters.forEach(button => button.addEventListener('click', () => {
    if (activeFilter === button.dataset.filter) return;
    activeFilter = button.dataset.filter;
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    cards.forEach(card => {
      card.hidden = activeFilter !== 'all' && card.dataset.category !== activeFilter;
      card.classList.remove('filter-enter');
      if (!card.hidden) {
        card.classList.add('is-visible');
        void card.offsetWidth;
        card.classList.add('filter-enter');
      }
    });
    announce();
  }));
  document.getElementById('language').addEventListener('change', announce);
  // Each card remains a normal document element: links and details work with keyboard and touch.
  cards.forEach(card => {
    let frame;
    card.addEventListener('pointermove', event => {
      if (reducedMotion.matches || !finePointer.matches) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = card.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width;
        const y = (event.clientY - box.top) / box.height;
        card.style.setProperty('--tilt-x', `${(0.5 - y) * 3}deg`);
        card.style.setProperty('--tilt-y', `${(x - 0.5) * 3}deg`);
        card.style.setProperty('--pointer-x', `${x * 100}%`);
        card.style.setProperty('--pointer-y', `${y * 100}%`);
      });
    });
    card.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
    });
  });
  let revealObserver;
  const revealElements = [...document.querySelectorAll('.section-heading,.treatment,.experience-photo,.experience-copy,.journal-grid,.faq-grid,.contact-grid')];
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px 30px 0px' });
    revealElements.forEach(el => {
      // Never hide content already on screen during initialization.
      if (el.getBoundingClientRect().top <= innerHeight) return;
      el.classList.add('reveal-pending');
      if (el.classList.contains('treatment')) el.style.setProperty('--reveal-delay', `${cards.indexOf(el) * 80}ms`);
      revealObserver.observe(el);
    });
  }
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    revealObserver?.disconnect();
    revealElements.forEach(el => el.classList.add('is-visible'));
  });
  const progress = document.querySelector('.scroll-progress');
  const header = document.querySelector('.site-header');
  const links = [...document.querySelectorAll('.nav-links a')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href')));
  let scrollFrame;
  function updateScroll() {
    scrollFrame = null;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    header.classList.toggle('is-scrolled', scrollY > 30);
    let active = -1;
    sections.forEach((section, index) => { if (section?.getBoundingClientRect().top <= 180) active = index; });
    links.forEach((link, index) => index === active ? link.setAttribute('aria-current', 'location') : link.removeAttribute('aria-current'));
  }
  function scheduleScroll() { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll); }
  addEventListener('scroll', scheduleScroll, { passive: true });
  addEventListener('resize', scheduleScroll);
  updateScroll();
})();
