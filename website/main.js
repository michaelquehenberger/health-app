(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Reveal on scroll
  const io = new IntersectionObserver((es) => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal, .split').forEach(el => io.observe(el));

  // Count-up numbers
  const cio = new IntersectionObserver((es) => es.forEach(e => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target, n = +el.dataset.count, suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = n + suf; return; }
    const t0 = performance.now(), d = 1600;
    const tick = (t) => {
      const p = Math.min((t - t0) / d, 1), v = Math.round(n * (1 - Math.pow(1 - p, 4)));
      el.textContent = v + suf;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  // Word-by-word highlight of the statement on scroll
  const st = document.getElementById('statement');
  if (st) {
    st.innerHTML = st.textContent.trim().split(/\s+/).map(w => `<span>${w}</span>`).join(' ');
    const words = $$('span', st);
    const update = () => {
      const r = st.getBoundingClientRect(), vh = innerHeight;
      const p = Math.min(Math.max((vh * .85 - r.top) / (r.height + vh * .25), 0), 1);
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    };
    addEventListener('scroll', update, { passive: true }); update();
  }

  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  // Glow + custom cursor
  const cur = document.querySelector('.cursor');
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  addEventListener('pointermove', e => {
    x = e.clientX; y = e.clientY;
    document.documentElement.style.setProperty('--mx', x + 'px');
    document.documentElement.style.setProperty('--my', y + 'px');
  }, { passive: true });
  (function loop() {
    cx += (x - cx) * .2; cy += (y - cy) * .2;
    cur.style.transform = `translate(${cx}px,${cy}px)`;
    requestAnimationFrame(loop);
  })();
  $$('a, summary, .btn, .card').forEach(el => {
    el.addEventListener('pointerenter', () => cur.classList.add('big'));
    el.addEventListener('pointerleave', () => cur.classList.remove('big'));
  });
  if (reduce) return;

  // Magnetic buttons
  $$('.magnetic').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  // 3D tilt on cards
  $$('.tilt').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `perspective(900px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
})();
