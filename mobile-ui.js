(() => {
  function initMobileMenu(){
    document.querySelectorAll('.site-header').forEach((header, i) => {
      const inner = header.querySelector('.header-inner');
      const nav = header.querySelector('.nav');
      if (!inner || !nav || header.querySelector('.mobile-menu-button')) return;
      if (!nav.id) nav.id = 'mobile-nav-' + i;

      const button = document.createElement('button');
      button.className = 'mobile-menu-button';
      button.type = 'button';
      button.setAttribute('aria-label', 'Open menu');
      button.setAttribute('aria-controls', nav.id);
      button.setAttribute('aria-expanded', 'false');
      button.innerHTML = '<span></span><span></span><span></span>';
      inner.appendChild(button);

      const setOpen = open => {
        header.classList.toggle('menu-open', open);
        button.setAttribute('aria-expanded', String(open));
        button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      };

      button.addEventListener('click', e => {
        e.stopPropagation();
        setOpen(!header.classList.contains('menu-open'));
      });
      nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
      document.addEventListener('click', e => { if (!header.contains(e.target)) setOpen(false); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
      window.addEventListener('resize', () => { if (window.innerWidth > 760) setOpen(false); });
    });
  }

  function init(){
    initMobileMenu();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();