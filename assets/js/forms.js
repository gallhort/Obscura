/* Maison Obscura — validation des formulaires (réservation et contact), 100 % front */
(function () {
  'use strict';
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var TEL = /^(?:(?:\+|00)33|0)\s?[1-9](?:[\s.-]?\d{2}){4}$/;
  var LABELS = { date: 'la date', convives: 'le nombre de convives', service: 'le service', formule: 'la formule',
                 prenom: 'votre prénom', nom: 'votre nom', email: 'votre e-mail', tel: 'votre téléphone',
                 accord: 'l’acceptation des conditions', sujet: 'le sujet', message: 'votre message' };

  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function addDays(n) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return d; }

  /* Règles : retourne un message d'erreur, ou '' si le champ est valide */
  var rules = {
    date: function (v) {
      if (!v) return 'Choisissez une date.';
      var d = new Date(v + 'T12:00:00');
      if (isNaN(d)) return 'Cette date n’est pas valide.';
      if (iso(d) < iso(addDays(1))) return 'Réservez au plus tôt pour demain.';
      if (iso(d) > iso(addDays(92))) return 'Les réservations ouvrent trois mois à l’avance.';
      if (d.getDay() === 0 || d.getDay() === 1) return 'Nous sommes fermés le dimanche et le lundi.';
      return '';
    },
    convives: function (v) { return v ? '' : 'Indiquez le nombre de convives.'; },
    service: function (v) { return v ? '' : 'Choisissez un service.'; },
    formule: function (v) { return v ? '' : 'Choisissez une formule.'; },
    prenom: function (v) { return v.trim().length < 2 ? 'Indiquez votre prénom.' : ''; },
    nom: function (v) { return v.trim().length < 2 ? 'Indiquez votre nom.' : ''; },
    email: function (v) { return !v.trim() ? 'Indiquez votre e-mail.' : (EMAIL.test(v.trim()) ? '' : 'Cet e-mail ne semble pas valide (exemple : nom@domaine.fr).'); },
    tel: function (v) { return !v.trim() ? 'Indiquez un numéro de téléphone.' : (TEL.test(v.trim()) ? '' : 'Numéro invalide (exemple : 06 12 34 56 78).'); },
    accord: function (v) { return v ? '' : 'Cette case est nécessaire pour réserver.'; },
    sujet: function (v) { return v ? '' : 'Choisissez un sujet.'; },
    message: function (v) { var n = v.trim().length; return n === 0 ? 'Écrivez votre message.' : (n < 15 ? 'Votre message est un peu court (15 caractères minimum).' : ''); }
  };

  function controls(form, name) { return form.querySelectorAll('[name="' + name + '"]'); }
  function valueOf(form, name) {
    var c = controls(form, name);
    if (!c.length) return '';
    if (c[0].type === 'radio') { for (var i = 0; i < c.length; i++) if (c[i].checked) return c[i].value; return ''; }
    if (c[0].type === 'checkbox') return c[0].checked;
    return c[0].value;
  }
  function errEl(form, name) { var c = controls(form, name)[0]; var id = c.id; var d = form.querySelector('#' + id + '-err'); return d || form.querySelector('#' + name + '-err'); }

  function check(form, name, show) {
    if (!rules[name] || !controls(form, name).length) return '';
    var msg = rules[name](valueOf(form, name));
    if (show !== false) {
      var el = errEl(form, name);
      if (el) el.textContent = msg;
      controls(form, name).forEach(function (c) { if (msg) c.setAttribute('aria-invalid', 'true'); else c.removeAttribute('aria-invalid'); });
    }
    return msg;
  }

  function fieldNames(form) {
    var seen = {}, out = [];
    form.querySelectorAll('[name]').forEach(function (c) { if (rules[c.name] && !seen[c.name]) { seen[c.name] = 1; out.push(c.name); } });
    return out;
  }

  function validate(form, summary) {
    var errors = [];
    fieldNames(form).forEach(function (n) { var m = check(form, n); if (m) errors.push({ name: n, msg: m }); });
    summary.innerHTML = '';
    if (errors.length) {
      var p = document.createElement('p'); p.innerHTML = '<strong>' + (errors.length > 1 ? errors.length + ' champs sont à corriger :' : 'Un champ est à corriger :') + '</strong>';
      var ul = document.createElement('ul');
      errors.forEach(function (e) {
        var li = document.createElement('li'), a = document.createElement('a');
        a.href = '#' + controls(form, e.name)[0].id; a.textContent = e.msg;
        a.addEventListener('click', function (ev) { ev.preventDefault(); controls(form, e.name)[0].focus(); });
        li.appendChild(a); ul.appendChild(li);
      });
      summary.appendChild(p); summary.appendChild(ul); summary.hidden = false;
      summary.focus();
    } else summary.hidden = true;
    return errors.length === 0;
  }

  function wire(form, summary, onValid) {
    form.noValidate = true;
    form.addEventListener('submit', function (e) { e.preventDefault(); if (validate(form, summary)) onValid(); });
    fieldNames(form).forEach(function (n) {
      controls(form, n).forEach(function (c) {
        c.addEventListener('blur', function () { if (c.type !== 'radio' && c.type !== 'checkbox') check(form, n); });
        c.addEventListener('change', function () { if (c.getAttribute('aria-invalid') || c.type === 'radio' || c.type === 'checkbox') check(form, n); });
        c.addEventListener('input', function () { if (c.getAttribute('aria-invalid')) check(form, n); });
      });
    });
  }
  function show(panel, form) { form.hidden = true; panel.hidden = false; panel.focus(); panel.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
  function reset(panel, form, summary) { form.reset(); form.querySelectorAll('[aria-invalid]').forEach(function (c) { c.removeAttribute('aria-invalid'); }); form.querySelectorAll('.err').forEach(function (e) { e.textContent = ''; }); summary.hidden = true; panel.hidden = true; form.hidden = false; var f = form.querySelector('input, select, textarea'); if (f) f.focus(); }
  function out(panel, key, val) { var el = panel.querySelector('[data-out="' + key + '"]'); if (el) el.textContent = val; }

  /* ---------- Réservation ---------- */
  var resa = document.getElementById('form-resa');
  if (resa) {
    var dateEl = resa.querySelector('#date');
    dateEl.min = iso(addDays(1)); dateEl.max = iso(addDays(92));
    var sum = document.getElementById('resa-summary'), ok = document.getElementById('resa-ok'), est = document.getElementById('estimation');
    var fmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
    function total() {
      var f = resa.querySelector('[name="formule"]:checked'), n = parseInt(valueOf(resa, 'convives'), 10);
      return f && n ? { n: n, prix: +f.dataset.prix, sum: n * +f.dataset.prix } : null;
    }
    function updateEstimate() {
      var t = total();
      est.innerHTML = t ? 'Estimation : <strong>' + fmt.format(t.sum) + '</strong> pour ' + t.n + ' personne' + (t.n > 1 ? 's' : '') + ' (' + fmt.format(t.prix) + ' par personne, boissons hors accords en supplément).'
                        : 'Choisissez une formule et un nombre de convives pour voir l’estimation.';
    }
    resa.addEventListener('change', updateEstimate);
    wire(resa, sum, function () {
      var d = new Date(valueOf(resa, 'date') + 'T12:00:00'), t = total();
      var ref = 'OBS-' + Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + String(d.getDate()).padStart(2, '0') + String(d.getMonth() + 1).padStart(2, '0');
      out(ok, 'prenom', valueOf(resa, 'prenom').trim());
      out(ok, 'ref', ref);
      out(ok, 'date', d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
      out(ok, 'service', valueOf(resa, 'service'));
      out(ok, 'convives', valueOf(resa, 'convives'));
      out(ok, 'formule', valueOf(resa, 'formule'));
      out(ok, 'total', t ? fmt.format(t.sum) : '');
      show(ok, resa);
    });
    document.getElementById('resa-reset').addEventListener('click', function () { reset(ok, resa, sum); updateEstimate(); });
  }

  /* ---------- Contact ---------- */
  var contact = document.getElementById('form-contact');
  if (contact) {
    var csum = document.getElementById('contact-summary'), cok = document.getElementById('contact-ok');
    wire(contact, csum, function () { out(cok, 'email', valueOf(contact, 'email').trim()); show(cok, contact); });
    document.getElementById('contact-reset').addEventListener('click', function () { reset(cok, contact, csum); });
  }
})();
