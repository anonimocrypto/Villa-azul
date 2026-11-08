/* Villa landing — app.js
 * Principios: (1) ningún módulo puede tumbar a los demás (cada init va en try/catch),
 *             (2) todo dato interpolado en HTML pasa por esc(),
 *             (3) el texto sale de VILLA_CONFIG / VILLA_UI, nunca hardcodeado aquí. */
(function () {
  'use strict';

  var C = window.VILLA_CONFIG, UI = window.VILLA_UI;
  if (!C || !UI) { console.error('Falta assets/villa.config.js o assets/i18n.js'); document.documentElement.classList.remove('intro-pending'); return; }

  var state = { lang: 'es', exp: new Set(), cat: 'all', lb: 0, quote: null };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- utilidades ---------- */
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var t = function (v) { return v && typeof v === 'object' ? (v[state.lang] || v.es || '') : (v == null ? '' : v); };
  var ui = function (k, vars) {
    var s = (UI[state.lang] && UI[state.lang][k]); if (s == null) s = UI.es[k]; if (s == null) return k;
    return vars ? s.replace(/\{(\w+)\}/g, function (_, n) { return vars[n] != null ? vars[n] : ''; }) : s;
  };
  var money = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); }; // siempre en-US: "$1,380" igual para todos
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var toISO = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var fromISO = function (s) { var p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2], 12); };
  var addDays = function (d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; };
  var storage = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var safe = function (name, fn) { try { fn(); } catch (e) { console.error('[villa] ' + name + ' falló:', e); } };

  // "Hoy" en la zona horaria de la VILLA (no en UTC): corrige el bug de 'mañana' = pasado mañana después de las 8 pm.
  function todayInVilla() {
    try { return fromISO(new Intl.DateTimeFormat('en-CA', { timeZone: C.timezone }).format(new Date())); }
    catch (e) { return fromISO(toISO(new Date())); }
  }
  var imgUrl = function (id, w, q) { return 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=' + w + '&q=' + (q || 70); };
  var fmtDate = function (iso) {
    return new Intl.DateTimeFormat(state.lang === 'en' ? 'en-US' : 'es-DO', { day: 'numeric', month: 'short', year: 'numeric' }).format(fromISO(iso)); // "8 nov 2026" / "Nov 8, 2026": sin ambigüedad dd/mm vs mm/dd
  };

  /* ---------- analítica (no-op si no hay proveedor) ---------- */
  function track(name, params) {
    try {
      params = params || {};
      if (typeof window.gtag === 'function') window.gtag('event', name, params);
      if (typeof window.plausible === 'function') window.plausible(name, { props: params });
      (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: name }, params));
    } catch (e) {}
  }

  /* ---------- iconos ---------- */
  var ICONS = {
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    pool: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
    beach: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    chef: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
    wifi: '<path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>',
    ac: '<path d="M2 12h20M12 2v20M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4"/>'
  };
  var icon = function (n, cls) { return '<svg class="' + (cls || 'w-6 h-6') + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || '') + '</svg>'; };

  /* ---------- i18n ---------- */
  function applyLang(lang, persist) {
    state.lang = (lang === 'en') ? 'en' : 'es';
    document.documentElement.lang = state.lang;
    if (persist) storage.set('vac_lang', state.lang);

    $$('[data-i18n]').forEach(function (el) { el.textContent = ui(el.getAttribute('data-i18n')); });
    $$('[data-i18n-html]').forEach(function (el) { el.innerHTML = ui(el.getAttribute('data-i18n-html')); }); // solo strings de i18n.js (confiables)
    $$('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) { var kv = pair.split(':'); if (kv[1]) el.setAttribute(kv[0].trim(), ui(kv[1].trim())); });
    });
    $$('[data-lang]').forEach(function (b) {
      var on = b.getAttribute('data-lang') === state.lang;
      b.setAttribute('aria-pressed', String(on));
      b.className = 'px-3 py-1.5 rounded-md transition-colors ' + (on ? 'bg-[#d4af37] text-black' : 'text-neutral-300 hover:text-white');
    });
    document.title = ui('meta_title');
    var md = $('meta[name="description"]'); if (md) md.setAttribute('content', ui('meta_desc'));

    renderGuests(); renderHighlights(); renderGallery(); renderExperiences(); renderPerks(); renderOfferExtras();
    renderReviews(); renderDistances(); renderFaq(); renderStaticBinds(); refreshQuote(); buildJsonLd();
    var mb = $('#mobile-menu-btn'); if (mb) mb.setAttribute('aria-label', ui($('#mobile-menu').classList.contains('hidden') ? 'menu_open' : 'menu_close'));
  }

  /* ---------- renderers (todo escapado) ---------- */
  function renderStaticBinds() {
    $$('[data-bind="guests"]').forEach(function (e) { e.textContent = C.capacity.guests; });
    $$('[data-bind="bedrooms"]').forEach(function (e) { e.textContent = C.capacity.bedrooms; });
    var ph = $('#foot-phone'); if (ph) ph.textContent = C.contact.phoneDisplay;
    var em = $('#foot-email'); if (em) { em.textContent = C.contact.email; em.href = 'mailto:' + C.contact.email; }
    var ad = $('#foot-address'); if (ad) ad.textContent = t(C.contact.address);
    var yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
    var sr = $('#stat-rating');
    if (sr) {
      if (C.rating) { sr.classList.remove('hidden'); sr.classList.add('flex'); $('#stat-rating-value').textContent = C.rating.value + ' ★'; $('#stat-rating-label').textContent = ui('stat_rating', { source: C.rating.source }) + ' · ' + C.rating.count; }
      else { sr.classList.add('hidden'); sr.classList.remove('flex'); }
    }
  }

  function renderGuests() {
    var sel = $('#guests-count'); if (!sel) return;
    var cur = sel.value || String(C.capacity.guests), html = '';
    for (var n = 1; n <= C.capacity.guests; n++) html += '<option value="' + n + '">' + n + ' ' + esc(ui(n === 1 ? 'guest_one' : 'guest_many')) + '</option>';
    sel.innerHTML = html; sel.value = cur;
  }

  function renderHighlights() {
    var g = $('#highlights-grid'); if (!g) return;
    g.innerHTML = C.highlights.map(function (h, i) {
      return '<article class="highlight-card glass-card p-7 rounded-2xl glass-card-hover flex flex-col justify-between">' +
        '<div><div class="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center ' + (i % 2 ? 'text-[#22d3ee]' : 'text-[#d4af37]') + ' mb-5">' + icon(h.icon) + '</div>' +
        '<h3 class="text-lg font-serif text-white mb-2">' + esc(t(h.title)) + '</h3>' +
        '<p class="text-sm text-neutral-300 leading-relaxed">' + esc(t(h.desc)) + '</p></div>' +
        '<span class="text-xs font-mono text-neutral-400 mt-4 block">' + esc(t(h.tag)) + '</span></article>';
    }).join('');
  }

  function renderGallery() {
    var g = $('#gallery-grid'); if (!g) return;
    $$('#gallery-tabs [data-cat]').forEach(function (b) {
      var on = b.getAttribute('data-cat') === state.cat;
      b.setAttribute('aria-pressed', String(on));
      b.className = 'px-3.5 py-2 rounded-lg transition-colors ' + (on ? 'bg-[#d4af37] text-black font-semibold' : 'text-neutral-300 hover:text-white');
    });
    g.innerHTML = C.gallery.map(function (it, idx) {
      if (state.cat !== 'all' && it.cat !== state.cat) return '';
      var cap = esc(t(it.title));
      return '<button type="button" data-idx="' + idx + '" class="gallery-item relative h-64 rounded-xl overflow-hidden group border border-neutral-800 shadow-md text-left" aria-label="' + cap + '">' +
        '<img src="' + imgUrl(it.id, 600, 65) + '" srcset="' + imgUrl(it.id, 400, 65) + ' 400w, ' + imgUrl(it.id, 800, 65) + ' 800w" sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" width="600" height="400" alt="' + cap + '" loading="lazy" decoding="async" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />' +
        '<span class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></span>' +
        '<span class="absolute bottom-3 left-3 right-3 font-serif text-sm text-white drop-shadow truncate">' + cap + '</span></button>';
    }).join('');
  }

  function renderExperiences() {
    var g = $('#experiences-grid'); if (!g) return;
    g.innerHTML = C.experiences.map(function (e) {
      var on = state.exp.has(e.id), title = esc(t(e.title));
      return '<article class="glass-card rounded-2xl overflow-hidden border ' + (on ? 'border-[#d4af37]' : 'border-neutral-800') + ' flex flex-col">' +
        '<div class="relative h-44 overflow-hidden"><img src="' + imgUrl(e.img, 500, 65) + '" width="500" height="300" alt="' + title + '" loading="lazy" decoding="async" class="w-full h-full object-cover" />' +
        '<div class="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent"></div>' +
        '<span class="absolute top-3 right-3 text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-black/75 text-[#d4af37] border border-neutral-700">+' + money(e.price) + ' ' + esc(C.pricing.currency) + ' · ' + esc(t(e.unit)) + '</span></div>' +
        '<div class="p-5 flex-1 flex flex-col justify-between gap-4"><div><h3 class="font-serif text-base text-white mb-1.5">' + title + '</h3>' +
        '<p class="text-sm text-neutral-300 leading-relaxed">' + esc(t(e.desc)) + '</p></div>' +
        '<button type="button" data-exp="' + esc(e.id) + '" aria-pressed="' + on + '" class="w-full py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg border transition-colors ' + (on ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'text-[#d4af37] border-[#d4af37]/50 hover:bg-[#d4af37]/10') + '">' + esc(ui(on ? 'btn_remove_exp' : 'btn_add_exp')) + '</button></div></article>';
    }).join('');
  }

  function renderPerks() {
    var l = $('#perks-list'); if (!l) return;
    l.innerHTML = C.perks.map(function (p) { return '<li class="flex items-start gap-2"><span class="text-[#d4af37]" aria-hidden="true">✓</span><span>' + esc(t(p)) + '</span></li>'; }).join('');
  }

  function renderOfferExtras() {
    var u = $('#urgency-pill'), r = $('#response-time');
    if (u) { if (C.urgency) { u.textContent = '● ' + t(C.urgency); u.classList.remove('hidden'); u.classList.add('inline-flex'); } else u.classList.add('hidden'); }
    if (r) { if (C.responseTime) { r.textContent = t(C.responseTime); r.classList.remove('hidden'); } else r.classList.add('hidden'); }
  }

  function renderReviews() {
    var g = $('#reviews-grid'); if (!g) return;
    g.innerHTML = C.reviews.map(function (r) {
      return '<figure class="glass-card p-7 rounded-2xl border border-neutral-800 flex flex-col justify-between">' +
        '<div><div class="flex items-center justify-between mb-4"><span class="text-[#d4af37] text-sm" aria-label="5/5">★★★★★</span>' +
        (C.demoMode && r.sample ? '<span class="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">' + esc(ui('reviews_sample')) + '</span>' : '') + '</div>' +
        '<blockquote class="text-sm text-neutral-200 italic leading-relaxed mb-6 font-serif">“' + esc(t(r.text)) + '”</blockquote></div>' +
        '<figcaption class="border-t border-neutral-800 pt-4 flex items-center justify-between"><div><p class="text-sm font-semibold text-white">' + esc(r.name) + '</p><p class="text-xs text-neutral-400">' + esc(r.from) + '</p></div>' +
        '<span class="text-xs text-neutral-400 font-mono">' + esc(t(r.date)) + '</span></figcaption></figure>';
    }).join('');
    var line = $('#reviews-rating-line');
    if (line) { if (C.rating) { line.innerHTML = '<span class="text-[#d4af37]" aria-hidden="true">★★★★★</span> <strong>' + esc(C.rating.value) + '/5</strong> · ' + esc(C.rating.count) + ' · ' + esc(C.rating.source); line.classList.remove('hidden'); line.classList.add('flex'); } else line.classList.add('hidden'); }
  }

  function renderDistances() {
    var l = $('#distances-list'); if (!l) return;
    l.innerHTML = C.distances.map(function (d) {
      return '<li class="flex items-center justify-between gap-4 py-2.5 border-b border-neutral-800/60 last:border-0"><span class="text-neutral-200 flex items-center gap-2"><span aria-hidden="true">' + d.icon + '</span>' + esc(t(d.name)) + '</span><span class="font-mono text-xs text-neutral-300 text-right">' + esc(t(d.time)) + '</span></li>';
    }).join('');
  }

  function renderFaq() {
    var c = $('#faq-accordion'); if (!c) return;
    var open = $$('#faq-accordion details').map(function (d) { return d.open; });
    c.innerHTML = C.faq.map(function (f) {
      return '<details class="border border-neutral-800 rounded-xl bg-neutral-900/60 group"><summary class="p-5 text-sm font-medium text-white flex items-center justify-between gap-4 hover:text-[#d4af37]"><span>' + esc(t(f.q)) + '</span><span class="faq-chevron text-neutral-400" aria-hidden="true">▼</span></summary>' +
        '<div class="px-5 pb-5 text-sm text-neutral-300 leading-relaxed border-t border-neutral-800/60 pt-3">' + esc(t(f.a)) + '</div></details>';
    }).join('');
    $$('#faq-accordion details').forEach(function (d, i) { if (open[i]) d.open = true; }); // ya no se cierran al cambiar de idioma
  }

  /* ---------- cotizador ---------- */
  function isHigh(d) { return C.pricing.highSeasonMonths.indexOf(d.getMonth()) !== -1; }
  function isBlocked(iso) { return C.blockedRanges.some(function (r) { return iso >= r.from && iso <= r.to; }); }
  function firstFreeStart(from, nights) {
    for (var i = 0; i < 500; i++) {
      var s = addDays(from, i), ok = true;
      for (var n = 0; n < nights; n++) if (isBlocked(toISO(addDays(s, n)))) { ok = false; break; }
      if (ok) return s;
    }
    return from;
  }

  function initQuote() {
    var ci = $('#checkin-date'), co = $('#checkout-date'), gs = $('#guests-count');
    var today = todayInVilla(), min = C.stay.minNights;
    var start = firstFreeStart(addDays(today, 1), 4);
    ci.min = toISO(addDays(today, 1)); ci.value = toISO(start);
    co.min = toISO(addDays(start, min)); co.value = toISO(addDays(start, 4));
    gs.value = String(C.capacity.guests);

    ci.addEventListener('change', function () {
      if (!ci.value) return;
      var inD = fromISO(ci.value), minOut = addDays(inD, min);
      co.min = toISO(minOut);
      if (!co.value || fromISO(co.value) < minOut) co.value = toISO(addDays(inD, Math.max(min, 4)));
      refreshQuote(true);
    });
    co.addEventListener('change', function () {
      if (ci.value && co.value && fromISO(co.value) < addDays(fromISO(ci.value), min)) { // salida demasiado pronto → se corrige VISIBLEMENTE
        co.value = toISO(addDays(fromISO(ci.value), min)); refreshQuote(true, 'status_min'); return;
      }
      refreshQuote(true);
    });
    gs.addEventListener('change', function () { refreshQuote(true); });
    refreshQuote();
  }

  function computeQuote() {
    var inV = $('#checkin-date').value, outV = $('#checkout-date').value;
    if (!inV || !outV) return { status: 'pick' };
    var s = fromISO(inV), e = fromISO(outV), nights = Math.round((e - s) / 864e5);
    if (nights < 1) return { status: 'pick' };
    var hi = 0, reg = 0, base = 0, blocked = false;
    for (var i = 0; i < nights; i++) {
      var d = addDays(s, i);
      if (isBlocked(toISO(d))) blocked = true;
      if (isHigh(d)) { hi++; base += C.pricing.highSeasonPerNight; } else { reg++; base += C.pricing.basePerNight; }
    }
    var out = { status: blocked ? 'blocked' : (nights < C.stay.minNights ? 'min' : 'ok'), nights: nights, checkin: inV, checkout: outV, guests: parseInt($('#guests-count').value, 10) || C.capacity.guests, hi: hi, reg: reg, base: base };
    out.discount = Math.round(base * C.pricing.directDiscountPercent / 100);
    out.cleaning = C.pricing.cleaningFee;
    out.extras = C.experiences.filter(function (x) { return state.exp.has(x.id); }).map(function (x) { return { id: x.id, name: t(x.title), cost: x.price * (x.multiplier === 'nights' ? nights : (x.multiplier || 1)) }; });
    out.extrasTotal = out.extras.reduce(function (a, x) { return a + x.cost; }, 0);
    out.total = base - out.discount + out.cleaning + out.extrasTotal;
    return out;
  }

  var quoteTimer;
  function refreshQuote(userAction, forcedStatusKey) {
    var q = state.quote = computeQuote();
    var tot = $('#quote-total-display'), pill = $('#quote-nights-pill'), st = $('#quote-status'), sv = $('#quote-saving'), bl = $('#quote-breakdown-list'), dis = $('#quote-disclaimer'), lab = $('#quote-book-label');
    if (!tot) return;
    dis.textContent = ui('quote_disclaimer', { deposit: money(C.pricing.securityDeposit) + ' ' + C.pricing.currency });
    var ok = q.status === 'ok';
    tot.textContent = ok ? money(q.total) + ' ' + C.pricing.currency : '—';
    pill.textContent = q.nights ? q.nights + ' ' + ui(q.nights === 1 ? 'night_one' : 'night_many') : '—';
    sv.textContent = ok ? ui('quote_saving', { amount: money(q.discount) }) : '';
    st.textContent = forcedStatusKey ? ui(forcedStatusKey, { n: C.stay.minNights }) : (q.status === 'blocked' ? ui('status_blocked') : q.status === 'pick' ? ui('status_pick') : '');
    lab.textContent = ui(q.status === 'blocked' ? 'btn_alt_wa' : 'btn_book_wa');
    if (ok) {
      var rows = [];
      if (q.reg) rows.push([ui('bd_regular', { n: q.reg, rate: money(C.pricing.basePerNight) }), money(q.reg * C.pricing.basePerNight)]);
      if (q.hi) rows.push([ui('bd_high', { n: q.hi, rate: money(C.pricing.highSeasonPerNight) }), money(q.hi * C.pricing.highSeasonPerNight)]);
      rows.push([ui('bd_discount', { pct: C.pricing.directDiscountPercent }), '−' + money(q.discount)]);
      rows.push([ui('bd_cleaning'), money(q.cleaning)]);
      q.extras.forEach(function (x) { rows.push([x.name, money(x.cost)]); });
      rows.push([ui('bd_total'), money(q.total)]);
      bl.innerHTML = rows.map(function (r, i) { return '<li class="flex justify-between gap-3' + (i === rows.length - 1 ? ' border-t border-neutral-700 pt-1 text-white font-semibold' : '') + '"><span>' + esc(r[0]) + '</span><span>' + esc(r[1]) + '</span></li>'; }).join('');
    } else bl.innerHTML = '';
    updateWaLinks();
    renderExperiencesState();
    if (userAction) { clearTimeout(quoteTimer); quoteTimer = setTimeout(function () { track('quote_changed', { nights: q.nights || 0, status: q.status, total: ok ? q.total : 0 }); }, 800); }
  }

  function renderExperiencesState() { // actualiza solo los botones (no re-renderiza imágenes en cada cambio de fecha)
    $$('#experiences-grid [data-exp]').forEach(function (b) {
      var on = state.exp.has(b.getAttribute('data-exp'));
      b.setAttribute('aria-pressed', String(on));
      b.textContent = ui(on ? 'btn_remove_exp' : 'btn_add_exp');
      b.className = 'w-full py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg border transition-colors ' + (on ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'text-[#d4af37] border-[#d4af37]/50 hover:bg-[#d4af37]/10');
      b.closest('article').classList.toggle('border-[#d4af37]', on); b.closest('article').classList.toggle('border-neutral-800', !on);
    });
  }

  /* ---------- WhatsApp: enlaces reales <a href>, un mensaje por intención ---------- */
  function waMessage(kind) {
    var q = state.quote, hasDates = q && q.checkin && q.checkout && q.status !== 'pick';
    var datesTxt = hasDates ? ui('wa_inquiry_dates', { checkin: fmtDate(q.checkin), checkout: fmtDate(q.checkout), guests: q.guests }) : '';
    if (kind === 'booking' && q && q.status === 'ok') {
      var extras = q.extras.length ? ui('wa_extras', { list: q.extras.map(function (x) { return x.name; }).join(', '), amount: money(q.extrasTotal) }) : '';
      return ui('wa_booking', { villa: C.name, checkin: fmtDate(q.checkin), checkout: fmtDate(q.checkout), nights: q.nights + ' ' + ui(q.nights === 1 ? 'night_one' : 'night_many'), guests: q.guests, extras: extras, total: money(q.total) + ' ' + C.pricing.currency });
    }
    if (kind === 'offer') return ui('wa_offer', { villa: C.name, dates: datesTxt });
    return ui('wa_inquiry', { villa: C.name, dates: datesTxt }); // inquiry, y 'booking' con fechas no disponibles
  }
  function updateWaLinks() {
    $$('[data-wa]').forEach(function (a) {
      a.href = 'https://wa.me/' + C.contact.whatsapp + '?text=' + encodeURIComponent(waMessage(a.getAttribute('data-wa')));
      a.target = '_blank'; a.rel = 'noopener noreferrer';
    });
  }
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('[data-wa]'); if (!a) return;
    track('whatsapp_click', { intent: a.getAttribute('data-wa'), source: a.getAttribute('data-wa-source') || a.id || 'page', quote_total: (state.quote && state.quote.status === 'ok') ? state.quote.total : 0 });
  });

  /* ---------- lightbox con <dialog> ---------- */
  var lbEl, lbImg, touchX = null;
  function openLb(i) {
    state.lb = (i + C.gallery.length) % C.gallery.length;
    var it = C.gallery[state.lb];
    lbImg.src = imgUrl(it.id, 1400, 78); lbImg.alt = t(it.title);
    $('#lb-caption').textContent = t(it.title); $('#lb-counter').textContent = (state.lb + 1) + ' / ' + C.gallery.length;
    if (!lbEl.open) { lbEl.showModal(); document.body.style.overflow = 'hidden'; track('gallery_open', { index: state.lb }); }
  }
  function initLightbox() {
    lbEl = $('#lightbox'); lbImg = $('#lb-img');
    $('#gallery-grid').addEventListener('click', function (e) { var b = e.target.closest('.gallery-item'); if (b) openLb(parseInt(b.getAttribute('data-idx'), 10)); });
    $('#lb-close').addEventListener('click', function () { lbEl.close(); });
    $('#lb-prev').addEventListener('click', function () { openLb(state.lb - 1); });
    $('#lb-next').addEventListener('click', function () { openLb(state.lb + 1); });
    lbEl.addEventListener('close', function () { document.body.style.overflow = ''; });
    lbEl.addEventListener('click', function (e) { if (e.target.id === 'lightbox' || e.target.id === 'lightbox-stage') lbEl.close(); });
    lbEl.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') openLb(state.lb - 1); if (e.key === 'ArrowRight') openLb(state.lb + 1); });
    lbEl.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
    lbEl.addEventListener('touchend', function (e) { if (touchX == null) return; var dx = e.changedTouches[0].clientX - touchX; if (Math.abs(dx) > 50) openLb(state.lb + (dx < 0 ? 1 : -1)); touchX = null; }, { passive: true });
  }

  /* ---------- menú móvil, mapa, JSON-LD ---------- */
  function initMenu() {
    var btn = $('#mobile-menu-btn'), menu = $('#mobile-menu');
    var set = function (open) { menu.classList.toggle('hidden', !open); btn.setAttribute('aria-expanded', String(open)); btn.setAttribute('aria-label', ui(open ? 'menu_close' : 'menu_open')); };
    btn.addEventListener('click', function () { set(menu.classList.contains('hidden')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.classList.contains('hidden')) { set(false); btn.focus(); } });
    document.addEventListener('click', function (e) { if (!menu.classList.contains('hidden') && !e.target.closest('#site-header')) set(false); });
  }

  function initMap() {
    var btn = $('#map-load-btn'); if (!btn) return;
    btn.addEventListener('click', function () {
      var box = $('#map-box'), f = document.createElement('iframe');
      f.src = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30089.475471974716!2d-70.72089473041355!3d19.80332800539116!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8eb1dd755c0c9d7d%3A0x6b642a8b9f1d044!2sPuerto%20Plata%2C%20Dominican%20Republic!5e0!3m2!1sen!2sus!4v1710000000000!5m2!1sen!2sus'; f.title = ui('map_title'); f.loading = 'lazy'; f.referrerPolicy = 'strict-origin-when-cross-origin';
      f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
      f.className = 'absolute inset-0 w-full h-full border-0 [filter:invert(90%)_hue-rotate(180deg)_contrast(88%)]';
      box.insertBefore(f, box.firstChild); document.body.classList.add('map-ready');
    });
    var ml = $('#maps-link'); if (ml) ml.href = 'https://www.google.com/maps/search/?api=1&query=' + C.geo.lat + ',' + C.geo.lng;
  }

  function buildJsonLd() {
    var old = $('#ld-json'); if (old) old.remove();
    var origin = C.siteUrl.replace(/\/$/, '');
    var ld = [{
      '@context': 'https://schema.org', '@type': 'LodgingBusiness', name: C.name, url: origin + '/', description: ui('meta_desc'), telephone: C.contact.phoneDisplay, email: C.contact.email,
      image: C.gallery.slice(0, 8).map(function (g) { return imgUrl(g.id, 1200, 75); }),
      address: { '@type': 'PostalAddress', addressLocality: 'Puerto Plata', addressCountry: 'DO' },
      geo: { '@type': 'GeoCoordinates', latitude: C.geo.lat, longitude: C.geo.lng },
      numberOfRooms: C.capacity.bedrooms, checkinTime: C.stay.checkIn, checkoutTime: C.stay.checkOut,
      amenityFeature: C.highlights.map(function (h) { return { '@type': 'LocationFeatureSpecification', name: t(h.title), value: true }; })
    }, {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: C.faq.map(function (f) { return { '@type': 'Question', name: t(f.q), acceptedAnswer: { '@type': 'Answer', text: t(f.a) } }; })
    }];
    // aggregateRating SOLO con datos reales (publicar uno inventado puede acarrear acción manual de Google y sanciones de consumo)
    if (C.rating && !C.demoMode) ld[0].aggregateRating = { '@type': 'AggregateRating', ratingValue: C.rating.value, reviewCount: C.rating.count, bestRating: 5 };
    var s = document.createElement('script'); s.type = 'application/ld+json'; s.id = 'ld-json';
    s.textContent = JSON.stringify(ld).replace(/</g, '\\u003c'); document.head.appendChild(s);
  }

  /* ---------- intro (5 s) ---------- */
  var introDone = false;
  function finishIntro() {
    if (introDone) return; introDone = true;
    try { sessionStorage.setItem('vac_intro', '1'); } catch (e) {}
    document.documentElement.classList.remove('intro-pending');
    var pg = $('#page'); if (pg) pg.removeAttribute('inert');
    if (window.gsap) { try { window.gsap.killTweensOf('*'); window.gsap.set('#site-header,#hero-media-wrapper,#hero-kicker,#hero-title,#hero-subtitle,#hero-ctas,#hero-trust-bar,#booking-section,.highlight-card', { clearProps: 'all' }); } catch (e) {} } // clearProps devuelve el control al CSS (el hover de las tarjetas vuelve a funcionar)
  }
  function initIntro() {
    var root = document.documentElement;
    if (!root.classList.contains('intro-pending')) return;
    var pg = $('#page'); if (pg) pg.setAttribute('inert', '');
    var skip = $('#skip-intro-btn');
    var tl = null;
    var skipNow = function () { try { if (tl) tl.progress(1); } catch (e) {} finishIntro(); };
    if (skip) { skip.addEventListener('click', skipNow); skip.focus(); }
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !introDone) skipNow(); }); // sin {once:true}: antes la primera tecla (cualquiera) lo desactivaba
    setTimeout(finishIntro, 7500); // watchdog
    if (!window.gsap) { finishIntro(); return; }
    try {
      var g = window.gsap, W = window.innerWidth, H = window.innerHeight;
      var el = function (id) { return document.getElementById(id); };
      var cD = el('cursor-design'), cP = el('cursor-photos'), cT = el('cursor-texts'), cB = el('cursor-booking');
      var hdr = el('site-header'), bg = el('hero-media-wrapper'), kick = el('hero-kicker'), ttl = el('hero-title'), sub = el('hero-subtitle'), ctas = el('hero-ctas'), trust = el('hero-trust-bar'), bar = el('booking-section'), badge = el('intro-loader-badge'), ov = el('intro-overlay');
      g.set(hdr, { y: -80, opacity: 0 }); g.set(bg, { opacity: 0, scale: 1.15 });
      g.set([kick, ttl, sub, ctas, trust], { opacity: 0, y: 35 }); g.set(bar, { opacity: 0, y: 50, scale: .95 }); g.set('.highlight-card', { opacity: 0, y: 30 });
      tl = g.timeline({ onComplete: finishIntro });
      tl.fromTo(cD, { x: -60, y: -60, opacity: 0, scale: .6 }, { x: W * .1, y: 40, opacity: 1, scale: 1, duration: .5, ease: 'power2.out' }, 0)
        .fromTo(cP, { x: W + 60, y: H * .2, opacity: 0, scale: .6 }, { x: W * .75, y: H * .25, opacity: 1, scale: 1, duration: .5, ease: 'power2.out' }, .05)
        .fromTo(cT, { x: -60, y: H * .45, opacity: 0, scale: .6 }, { x: W * .25, y: H * .4, opacity: 1, scale: 1, duration: .5, ease: 'power2.out' }, .1)
        .fromTo(cB, { x: W * .5, y: H + 60, opacity: 0, scale: .6 }, { x: W * .5, y: H * .75, opacity: 1, scale: 1, duration: .5, ease: 'power2.out' }, .15)
        .to(badge, { opacity: 0, duration: .4 }, .3);
      tl.to(cD, { x: Math.min(W * .18, 140), y: 36, duration: .6, ease: 'power2.inOut' }, .5)
        .fromTo('#ripple-design', { scale: .2, opacity: 1 }, { scale: 2.2, opacity: 0, duration: .4 }, 1.05)
        .to(hdr, { y: 0, opacity: 1, duration: .5, ease: 'back.out(1.2)' }, 1.1);
      tl.to(cP, { x: W * .52, y: H * .32, duration: .7, ease: 'power3.inOut' }, 1.2)
        .fromTo('#ripple-photos', { scale: .2, opacity: 1 }, { scale: 2.2, opacity: 0, duration: .4 }, 1.85)
        .to(bg, { opacity: 1, scale: 1, duration: .8, ease: 'power2.out' }, 1.85);
      tl.to(cT, { x: W * .42, y: H * .38, duration: .65, ease: 'power2.inOut' }, 2.0)
        .fromTo('#ripple-texts', { scale: .2, opacity: 1 }, { scale: 2.2, opacity: 0, duration: .4 }, 2.6)
        .to(kick, { opacity: 1, y: 0, duration: .3 }, 2.65).to(ttl, { opacity: 1, y: 0, duration: .5 }, 2.7)
        .to(sub, { opacity: 1, y: 0, duration: .4 }, 2.85).to([ctas, trust], { opacity: 1, y: 0, stagger: .1, duration: .4 }, 2.95);
      tl.to(cB, { x: W * .5, y: Math.min(H * .68, H - 180), duration: .6, ease: 'power2.inOut' }, 2.8)
        .fromTo('#ripple-booking', { scale: .2, opacity: 1 }, { scale: 2.2, opacity: 0, duration: .4 }, 3.35)
        .to(bar, { opacity: 1, y: 0, scale: 1, duration: .5, ease: 'back.out(1.1)' }, 3.4)
        .to('.highlight-card', { opacity: 1, y: 0, stagger: .08, duration: .5 }, 3.55);
      tl.to([cD, cP, cT, cB], { opacity: 0, scale: .7, duration: .9, ease: 'power2.in' }, 4.0).to(ov, { opacity: 0, duration: .5 }, 4.5);
    } catch (err) { console.error('[villa] intro falló, se omite:', err); finishIntro(); }
  }

  /* ---------- arranque: cada módulo aislado ---------- */
  function boot() {
    safe('i18n', function () { var saved = storage.get('vac_lang'); var nav = (navigator.language || 'es').toLowerCase(); applyLang(saved || (nav.indexOf('en') === 0 ? 'en' : 'es'), false); });
    safe('quote', initQuote);
    safe('menu', initMenu);
    safe('lightbox', initLightbox);
    safe('map', initMap);
    safe('lang-buttons', function () { $$('[data-lang]').forEach(function (b) { b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang'), true); track('lang_change', { lang: state.lang }); }); }); });
    safe('gallery-tabs', function () { $('#gallery-tabs').addEventListener('click', function (e) { var b = e.target.closest('[data-cat]'); if (!b) return; state.cat = b.getAttribute('data-cat'); renderGallery(); }); });
    safe('experiences', function () {
      $('#experiences-grid').addEventListener('click', function (e) {
        var b = e.target.closest('[data-exp]'); if (!b) return; var id = b.getAttribute('data-exp');
        if (state.exp.has(id)) state.exp.delete(id); else { state.exp.add(id); track('experience_added', { id: id }); }
        refreshQuote(true);
      });
    });
    safe('intro', initIntro); // la intro va al final: si falla, el sitio ya funciona
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
