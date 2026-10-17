/* Maison Obscura — torche, mode clair, navigation, révélations, ambiance sonore */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var KEY = 'obscura-lumiere';
  var $ = function (s, c) { return (c || document).querySelector(s); };

  /* ---------- Mode clair ---------- */
  var lightBtn = $('#btn-lumiere');
  var themeMeta = $('meta[name="theme-color"]');
  function renderLight() {
    var on = root.classList.contains('lumiere');
    if (lightBtn) {
      var label = $('.tool-label', lightBtn);
      label.textContent = on ? label.dataset.on : label.dataset.off;
    }
    if (themeMeta) themeMeta.setAttribute('content', on ? '#f7efe1' : '#07060a');
  }
  function setLight(on) {
    root.classList.toggle('lumiere', on);
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* stockage indisponible */ }
    renderLight();
    if (on) stopTorch(); else startTorch();
  }
  if (lightBtn) lightBtn.addEventListener('click', function () { setLight(!root.classList.contains('lumiere')); });
  renderLight();

  /* ---------- Navigation mobile ---------- */
  var toggle = $('.nav-toggle'), nav = $('#menu-principal');
  function closeNav() { if (toggle) { toggle.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); } }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('open', open);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { closeNav(); toggle.focus(); } });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });
  }

  /* ---------- Torche ---------- */
  var torch = document.createElement('div');
  torch.className = 'torche';
  torch.setAttribute('aria-hidden', 'true');
  document.body.appendChild(torch);

  var hint = document.createElement('p');
  hint.className = 'torche-hint';
  hint.setAttribute('aria-hidden', 'true');
  hint.textContent = ('ontouchstart' in window ? 'Glissez le doigt' : 'Bougez le curseur') + ' pour éclairer la page, ou allumez la lumière.';
  document.body.appendChild(hint);
  var hintTimer = setTimeout(hideHint, 9000);
  function hideHint() { hint.classList.add('gone'); clearTimeout(hintTimer); }

  var S = { x: innerWidth * .5, y: innerHeight * .4, tx: innerWidth * .5, ty: innerHeight * .4,
            mode: 'auto', last: 0, t0: 0, raf: 0, touch: false };
  function baseRadius() {
    var r = Math.min(innerWidth, innerHeight) * .34;
    return Math.max(150, Math.min(r, 320)) * (S.touch ? 1.1 : 1);
  }
  function aim(x, y, mode) { S.tx = x; S.ty = y; S.mode = mode; S.last = performance.now(); hideHint(); if (reduce.matches) frame(performance.now()); }

  addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return; // géré par touchmove, qui continue pendant le défilement
    aim(e.clientX, e.clientY, 'pointer');
  }, { passive: true });
  function onTouch(e) { var t = e.touches[0]; if (t) { S.touch = true; aim(t.clientX, t.clientY, 'touch'); } }
  addEventListener('touchstart', onTouch, { passive: true });
  addEventListener('touchmove', onTouch, { passive: true });
  document.addEventListener('focusin', function (e) {
    var el = e.target;
    if (!el.matches || !el.matches(':focus-visible') || el.closest('.site-header')) return;
    var r = el.getBoundingClientRect();
    aim(r.left + Math.min(r.width, 400) / 2, r.top + Math.min(r.height, 200) / 2, 'focus');
  });
  addEventListener('resize', function () { if (S.mode === 'auto') { S.tx = innerWidth * .5; S.ty = innerHeight * .4; } });

  function frame(now) {
    if (root.classList.contains('lumiere')) { S.raf = 0; return; }
    var still = reduce.matches;
    // La torche se promène seule tant que personne ne la tient (et reprend après 6 s au doigt)
    if (!still && (S.mode === 'auto' || (S.mode === 'touch' && now - S.last > 6000))) {
      var t = now / 1000;
      S.tx = innerWidth * (.5 + .3 * Math.sin(t * .35));
      S.ty = innerHeight * (.42 + .22 * Math.sin(t * .27 + 1.3));
    } else if (still && S.mode === 'auto') { S.tx = innerWidth * .5; S.ty = innerHeight * .4; }
    var k = still ? 1 : (S.mode === 'pointer' ? .22 : .12);
    S.x += (S.tx - S.x) * k; S.y += (S.ty - S.y) * k;
    // Allumage progressif puis vacillement de flamme
    var ignite = still ? 1 : Math.min(1, (now - S.t0) / 1500);
    ignite = 1 - Math.pow(1 - ignite, 3);
    var flick = still ? 1 : 1 + .022 * Math.sin(now * .0031) + .014 * Math.sin(now * .0077 + 1) + .008 * Math.sin(now * .019 + 2);
    var r = baseRadius() * ignite * flick;
    torch.style.setProperty('--tx', S.x.toFixed(1) + 'px');
    torch.style.setProperty('--ty', S.y.toFixed(1) + 'px');
    torch.style.setProperty('--tr', Math.max(r, 1).toFixed(1) + 'px');
    S.raf = still ? 0 : requestAnimationFrame(frame);
  }
  function startTorch() {
    if (S.raf) return;
    S.t0 = performance.now();
    S.raf = requestAnimationFrame(frame);
  }
  function stopTorch() { cancelAnimationFrame(S.raf); S.raf = 0; }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stopTorch(); else if (!root.classList.contains('lumiere')) { S.t0 = performance.now() - 1500; startTorch(); } });
  reduce.addEventListener && reduce.addEventListener('change', function () { stopTorch(); if (!root.classList.contains('lumiere')) startTorch(); });
  if (!root.classList.contains('lumiere')) startTorch();

  /* ---------- Révélations au défilement ---------- */
  var items = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    items.forEach(function (el) { io.observe(el); });
  } else { items.forEach(function (el) { el.classList.add('is-in'); }); }

  /* ---------- Ambiance sonore (synthétisée, coupée par défaut) ---------- */
  var soundBtn = $('#btn-son');
  var audio = null;
  function buildAudio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    var ctx = new AC(), master = ctx.createGain();
    master.gain.value = 0; master.connect(ctx.destination);
    // Souffle de salle : bruit brun filtré
    var len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0), last = 0;
    for (var i = 0; i < len; i++) { var w = Math.random() * 2 - 1; last = (last + .02 * w) / 1.02; d[i] = last * 3.5; }
    var noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
    var ng = ctx.createGain(); ng.gain.value = .55;
    noise.connect(lp); lp.connect(ng); ng.connect(master); noise.start();
    // Nappe grave très douce
    [55, 82.41].forEach(function (f, n) {
      var o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f; g.gain.value = .05;
      lfo.frequency.value = .06 + n * .04; lg.gain.value = .03;
      lfo.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(master); o.start(); lfo.start();
    });
    // Tintements de verre, espacés au hasard
    var echo = ctx.createDelay(1); echo.delayTime.value = .32;
    var fb = ctx.createGain(); fb.gain.value = .35; echo.connect(fb); fb.connect(echo); echo.connect(master);
    var timer = 0;
    function ping() {
      if (ctx.state === 'running') {
        var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
        o.type = 'sine'; o.frequency.value = [1568, 2093, 2637, 3136][Math.floor(Math.random() * 4)];
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .01); g.gain.exponentialRampToValueAtTime(.0005, t + 1.6);
        o.connect(g); g.connect(master); g.connect(echo); o.start(t); o.stop(t + 1.7);
      }
      timer = setTimeout(ping, 5000 + Math.random() * 9000);
    }
    timer = setTimeout(ping, 3000);
    return { ctx: ctx, master: master };
  }
  function setSound(on) {
    if (on && !audio) audio = buildAudio();
    if (!audio) { soundBtn.hidden = true; return; }
    var t = audio.ctx.currentTime;
    if (on) { audio.ctx.resume(); audio.master.gain.cancelScheduledValues(t); audio.master.gain.linearRampToValueAtTime(.55, t + 1.5); }
    else { audio.master.gain.cancelScheduledValues(t); audio.master.gain.linearRampToValueAtTime(0, t + .6); setTimeout(function () { audio.ctx.suspend(); }, 700); }
    var label = $('.tool-label', soundBtn);
    label.textContent = on ? label.dataset.on : label.dataset.off;
    soundBtn.classList.toggle('is-on', on);
  }
  if (soundBtn) {
    soundBtn.addEventListener('click', function () { setSound(!soundBtn.classList.contains('is-on')); });
  }
})();
