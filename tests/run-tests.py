"""
Pruebas de regresión (Playwright + Chromium). Sin red: los CDN se bloquean a propósito (peor caso).
Uso:   pip install playwright && playwright install chromium && python3 tests/run-tests.py
"""
import json, pathlib, sys, re
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / "index.html").as_uri()
results = []
CONFIG_JS = (ROOT / "assets" / "villa.config.js").read_text()
def check(name, cond, detail=""):
    results.append((name, bool(cond), detail)); print(("PASS " if cond else "FAIL ") + name + (f"  → {detail}" if detail and not cond else ""))

GSAP_STUB = """
(function(){
  function chain(){ var o={}; ['fromTo','to','set','killTweensOf'].forEach(function(m){o[m]=function(){return o}}); o.progress=function(){ if(o._done) return; o._done=true; if(o._cb) o._cb(); }; return o; }
  window.gsap = {
    set: function(t,v){ if(v && v.clearProps){ document.querySelectorAll(t).forEach(function(e){e.removeAttribute('style')}); } },
    killTweensOf: function(){},
    timeline: function(opts){ var o=chain(); o._cb = opts && opts.onComplete; return o; }
  };
})();
"""
def blocked(ctx):
    ctx.route("**/*", lambda r: r.abort() if r.request.url.startswith("http") else r.continue_())

with sync_playwright() as p:
    b = p.chromium.launch()

    # ---- T1: CDN caído (Tailwind + GSAP bloqueados) ----
    ctx = b.new_context(locale="es-DO"); blocked(ctx); pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL, wait_until="domcontentloaded"); pg.wait_for_timeout(600)
    check("T1 sin CDN: el overlay de intro NO bloquea la página", pg.evaluate("getComputedStyle(document.getElementById('intro-overlay')).display") == "none")
    check("T1 sin CDN: la clase intro-pending se retira", not pg.evaluate("document.documentElement.classList.contains('intro-pending')"))
    n = pg.evaluate("""({gal:document.querySelectorAll('#gallery-grid .gallery-item').length, faq:document.querySelectorAll('#faq-accordion details').length,
       rev:document.querySelectorAll('#reviews-grid figure').length, exp:document.querySelectorAll('#experiences-grid article').length, hl:document.querySelectorAll('#highlights-grid article').length})""")
    check("T1 sin CDN: galería 8 / FAQ 5 / reseñas 3 / experiencias 4 / highlights 6", n == dict(gal=8, faq=5, rev=3, exp=4, hl=6), n)
    check("T1 sin CDN: cero errores de JavaScript", errs == [], errs)
    check("T1 sin CDN: el cotizador calcula", re.match(r"^\$[\d,]+ USD$", pg.inner_text("#quote-total-display")) is not None, pg.inner_text("#quote-total-display"))
    ctx.close()

    # ---- T2: fecha por defecto a las 9:30 pm en Santo Domingo ----
    ctx = b.new_context(timezone_id="America/Santo_Domingo", locale="es-DO"); blocked(ctx); pg = ctx.new_page()
    pg.clock.install(time="2026-11-07T21:30:00-04:00"); pg.goto(URL, wait_until="domcontentloaded"); pg.wait_for_timeout(300)
    check("T2 fecha UTC: 'mañana' es 2026-11-08 (antes salía 11-09)", pg.input_value("#checkin-date") == "2026-11-08", pg.input_value("#checkin-date"))
    ctx.close()

    # ---- T3/T4/T5/T6: cotizador, extras y WhatsApp ----
    ctx = b.new_context(timezone_id="America/Santo_Domingo", locale="es-DO"); blocked(ctx); pg = ctx.new_page()
    pg.add_init_script("sessionStorage.setItem('vac_intro','1')")
    pg.goto(URL, wait_until="domcontentloaded"); pg.wait_for_timeout(300)
    pg.fill("#checkin-date", "2026-12-10"); pg.dispatch_event("#checkin-date", "change")
    pg.fill("#checkout-date", "2026-12-05")
    check("T3 checkout anterior: se corrige a la estadía mínima (≥2 noches)", pg.input_value("#checkout-date") == "2026-12-12", pg.input_value("#checkout-date"))
    check("T3 checkout anterior: el usuario VE el aviso", "mínima" in pg.inner_text("#quote-status").lower(), pg.inner_text("#quote-status"))
    pg.fill("#checkout-date", "2026-12-14"); pg.dispatch_event("#checkout-date", "change")
    # 4 noches de diciembre = 4×450=1800 −10% (180) +120 = 1740
    check("T3 cálculo diciembre 4 noches = $1,740", pg.inner_text("#quote-total-display") == "$1,740 USD", pg.inner_text("#quote-total-display"))
    pg.fill("#checkin-date", "2026-06-10"); pg.dispatch_event("#checkin-date", "change")
    pg.fill("#checkout-date", "2026-06-14"); pg.dispatch_event("#checkout-date", "change")
    check("T3 cálculo junio 4 noches = $1,380", pg.inner_text("#quote-total-display") == "$1,380 USD", pg.inner_text("#quote-total-display"))
    pg.fill("#checkin-date", "2026-12-29"); pg.dispatch_event("#checkin-date", "change")
    pg.fill("#checkout-date", "2027-01-02"); pg.dispatch_event("#checkout-date", "change")
    check("T3 cruce de año (4 noches alta) = $1,740", pg.inner_text("#quote-total-display") == "$1,740 USD", pg.inner_text("#quote-total-display"))
    pg.fill("#checkin-date", "2026-06-10"); pg.dispatch_event("#checkin-date", "change")
    pg.fill("#checkout-date", "2026-06-14"); pg.dispatch_event("#checkout-date", "change")

    pg.click("[data-exp='chef']")      # 150 × 4 noches = 600
    check("T4 experiencias: el chef se multiplica por noches (1380+600=1980)", pg.inner_text("#quote-total-display") == "$1,980 USD", pg.inner_text("#quote-total-display"))
    pg.click("[data-exp='transport']") # 90 × 2 = 180
    check("T4 experiencias: traslado ida y vuelta (+180 = 2160)", pg.inner_text("#quote-total-display") == "$2,160 USD", pg.inner_text("#quote-total-display"))
    href = pg.get_attribute("#quote-book-btn", "href")
    msg = __import__("urllib.parse").parse.unquote(href)
    check("T5 WhatsApp: enlace real https://wa.me/…", href.startswith("https://wa.me/18090000000?text="), href[:60])
    check("T5 WhatsApp: fecha sin ambigüedad (mes escrito)", re.search(r"(jun|Jun)", msg) is not None and "10/06" not in msg, msg[:160])
    check("T5 WhatsApp: incluye extras y total", "Chef" in msg and "$2,160" in msg, msg)
    fl = __import__("urllib.parse").parse.unquote(pg.get_attribute("[data-wa-source='floating']", "href"))
    check("T5 WhatsApp flotante = consulta (sin total ni 'quiero reservar')", "$" not in fl and "reservar" not in fl.lower(), fl)

    # idioma
    pg.click("#lang-en-btn"); pg.wait_for_timeout(150)
    check("T7 EN: <html lang> = en", pg.evaluate("document.documentElement.lang") == "en")
    main_txt = pg.inner_text("main")
    es_words = [w for w in ["Reservar", "Huéspedes", "Galería", "Preguntas", "Piscina", "Habitaciones", "Cocina", "Ubicación", "Cotizar", "noches", "Llegada", "Salida", "Servicios", "Suites con"] if w in main_txt]
    check("T7 EN: no queda español en <main>", es_words == [], es_words)
    check("T7 EN: el titular conserva el degradado dorado (antes se destruía)", pg.evaluate("!!document.querySelector('#offer-title .gold-gradient-text') && !!document.querySelector('#hero-title .gold-gradient-text')"))
    msg_en = __import__("urllib.parse").parse.unquote(pg.get_attribute("#quote-book-btn", "href"))
    check("T7 EN: el mensaje de WhatsApp sale en inglés", "I'd like to book" in msg_en and "Nov" not in msg_en and "Jun" in msg_en, msg_en[:120])
    check("T7 EN: pies de foto de la galería traducidos", "Infinity pool" in pg.inner_text("#gallery-grid") or pg.get_attribute(".gallery-item", "aria-label").startswith("Infinity"))
    pg.click("#faq-accordion summary >> nth=1"); pg.click("#lang-es-btn"); pg.wait_for_timeout(150)
    check("T8 el FAQ abierto sigue abierto al cambiar de idioma", pg.evaluate("document.querySelectorAll('#faq-accordion details')[1].open"))
    check("T8 ES: el titular de la oferta conserva el degradado", pg.evaluate("!!document.querySelector('#offer-title .gold-gradient-text')"))

    # lightbox
    pg.click(".gallery-item >> nth=2"); pg.wait_for_timeout(100)
    check("T9 lightbox abre (dialog nativo)", pg.evaluate("document.getElementById('lightbox').open"))
    c0 = pg.inner_text("#lb-counter"); pg.keyboard.press("ArrowRight"); c1 = pg.inner_text("#lb-counter")
    check("T9 lightbox: flecha derecha avanza", c0.startswith("3") and c1.startswith("4"), (c0, c1))
    pg.keyboard.press("Escape"); check("T9 lightbox: Esc cierra", not pg.evaluate("document.getElementById('lightbox').open"))
    pg.click("#gallery-tabs [data-cat='rooms']")
    check("T9 filtro 'Habitaciones' = 2 fotos", pg.evaluate("document.querySelectorAll('#gallery-grid .gallery-item').length") == 2)
    ctx.close()

    # ---- T10: fechas bloqueadas ----
    ctx = b.new_context(timezone_id="America/Santo_Domingo", locale="es-DO"); blocked(ctx)
    ctx.route("**/villa.config.js", lambda r: r.fulfill(body=CONFIG_JS + "\nwindow.VILLA_CONFIG.blockedRanges=[{from:'2026-11-08',to:'2026-11-20'},{from:'2026-12-20',to:'2026-12-27'}];", content_type="application/javascript"))
    pg = ctx.new_page(); pg.add_init_script("sessionStorage.setItem('vac_intro','1')")
    pg.clock.install(time="2026-11-07T12:00:00-04:00")
    pg.goto(URL, wait_until="domcontentloaded"); pg.wait_for_timeout(300)
    check("T10 bloqueos: la fecha por defecto salta el rango ocupado", pg.input_value("#checkin-date") == "2026-11-21", pg.input_value("#checkin-date"))
    pg.fill("#checkin-date", "2026-12-22"); pg.dispatch_event("#checkin-date", "change"); pg.fill("#checkout-date", "2026-12-26"); pg.dispatch_event("#checkout-date", "change")
    check("T10 bloqueos: fechas ocupadas → sin precio y con aviso", pg.inner_text("#quote-total-display") == "—" and "disponibles" in pg.inner_text("#quote-status"), (pg.inner_text("#quote-total-display"), pg.inner_text("#quote-status")))
    check("T10 bloqueos: el botón pasa a 'Consultar alternativas'", "alternativas" in pg.inner_text("#quote-book-label").lower())
    ctx.close()

    # ---- T11: intro con GSAP simulado: ESC tras otra tecla, watchdog, hover ----
    ctx = b.new_context(locale="es-DO"); blocked(ctx); pg = ctx.new_page(); pg.add_init_script(GSAP_STUB)
    pg.goto(URL, wait_until="domcontentloaded"); pg.wait_for_timeout(300)
    check("T11 intro activa en primera visita", pg.evaluate("document.documentElement.classList.contains('intro-pending')"))
    check("T11 intro: el contenido de fondo queda inerte (sin foco por detrás)", pg.evaluate("document.getElementById('page').hasAttribute('inert')"))
    pg.keyboard.press("Tab"); pg.keyboard.press("a"); pg.keyboard.press("Escape"); pg.wait_for_timeout(100)
    check("T11 intro: ESC funciona aunque antes se pulsaran otras teclas (bug 'once')", not pg.evaluate("document.documentElement.classList.contains('intro-pending')"))
    check("T11 intro: 'inert' se retira", not pg.evaluate("document.getElementById('page').hasAttribute('inert')"))
    check("T11 intro: sin estilos inline residuales en tarjetas (hover vuelve a funcionar)", pg.evaluate("[...document.querySelectorAll('.highlight-card')].every(e=>!e.getAttribute('style'))"))
    pg.reload(wait_until="domcontentloaded"); pg.wait_for_timeout(200)
    check("T11 intro: no se repite al recargar en la misma sesión", not pg.evaluate("document.documentElement.classList.contains('intro-pending')"))
    ctx.close()

    # watchdog (gsap que nunca termina)
    ctx = b.new_context(locale="es-DO"); blocked(ctx); pg = ctx.new_page(); pg.add_init_script(GSAP_STUB); pg.clock.install()
    pg.goto(URL, wait_until="domcontentloaded"); pg.clock.run_for(8000)
    check("T12 watchdog: la intro se cierra sola si algo se atasca (≤7.5 s)", not pg.evaluate("document.documentElement.classList.contains('intro-pending')"))
    ctx.close()

    # reduced motion
    ctx = b.new_context(reduced_motion="reduce", locale="es-DO"); blocked(ctx); pg = ctx.new_page(); pg.goto(URL, wait_until="domcontentloaded")
    check("T13 prefers-reduced-motion: no hay intro", not pg.evaluate("document.documentElement.classList.contains('intro-pending')"))
    ctx.close()

    # ---- T14: XSS vía config ----
    ctx = b.new_context(locale="es-DO"); blocked(ctx)
    evil = "\nwindow.VILLA_CONFIG.faq[0].q.es='<img src=x onerror=\"window.__xss=1\">';window.VILLA_CONFIG.reviews[0].name='<script>window.__xss=2<\\/script>';window.VILLA_CONFIG.gallery[0].title.es='\"><img src=x onerror=window.__xss=3>';"
    ctx.route("**/villa.config.js", lambda r: r.fulfill(body=CONFIG_JS + evil, content_type="application/javascript"))
    pg = ctx.new_page(); pg.add_init_script("sessionStorage.setItem('vac_intro','1')"); pg.goto(URL, wait_until="domcontentloaded"); pg.wait_for_timeout(500)
    check("T14 XSS: datos de config con HTML malicioso no ejecutan nada", pg.evaluate("window.__xss") is None, pg.evaluate("window.__xss"))
    check("T14 XSS: se muestran como texto literal", "<img src=x" in pg.inner_text("#faq-accordion"))
    ctx.close()

    # ---- T15: paridad ES estático vs diccionario ----
    ctx = b.new_context(locale="es-DO"); blocked(ctx); pg = ctx.new_page(); pg.add_init_script("sessionStorage.setItem('vac_intro','1')")
    pg.route("**/assets/app.js", lambda r: r.fulfill(body="/* app.js desactivado para leer el HTML estático */", content_type="application/javascript"))
    pg.goto(URL, wait_until="domcontentloaded"); pg.wait_for_timeout(200)
    diff = pg.evaluate("""() => { const UI = window.VILLA_UI.es, bad = [];
      const norm = s => s.replace(/\\s+/g,' ').trim();
      document.querySelectorAll('[data-i18n]').forEach(e => { if (e.closest('noscript')) return; const k=e.dataset.i18n; if (!(k in UI)) bad.push('FALTA '+k); else if (norm(e.textContent)!==norm(UI[k])) bad.push(k+': "'+norm(e.textContent)+'" ≠ "'+norm(UI[k])+'"'); });
      document.querySelectorAll('[data-i18n-html]').forEach(e => { const k=e.dataset.i18nHtml; if (!(k in UI)) bad.push('FALTA '+k); else if (norm(e.innerHTML)!==norm(UI[k])) bad.push(k+' (html) difiere'); });
      const EN = window.VILLA_UI.en; Object.keys(UI).forEach(k => { if (!(k in EN)) bad.push('EN sin '+k); });
      return bad; }""")
    check("T15 i18n: HTML estático ES == diccionario ES y EN tiene todas las claves", diff == [], diff)
    ctx.close()
    # ---- T16: detección automática de idioma ----
    for loc, esperado in (("en-US", "en"), ("es-DO", "es"), ("fr-FR", "es")):
        ctx = b.new_context(locale=loc); blocked(ctx); pg = ctx.new_page(); pg.add_init_script("sessionStorage.setItem('vac_intro','1')")
        pg.goto(URL, wait_until="domcontentloaded"); pg.wait_for_timeout(200)
        check(f"T16 idioma del navegador {loc} → {esperado}", pg.evaluate("document.documentElement.lang") == esperado)
        ctx.close()
    ctx = b.new_context(locale="en-US"); blocked(ctx); pg = ctx.new_page(); pg.add_init_script("sessionStorage.setItem('vac_intro','1')")
    pg.goto(URL, wait_until="domcontentloaded"); pg.click("#lang-es-btn"); pg.reload(wait_until="domcontentloaded"); pg.wait_for_timeout(200)
    check("T16 la elección manual de idioma se recuerda", pg.evaluate("document.documentElement.lang") == "es")
    ctx.close()
    b.close()

fails = [r for r in results if not r[1]]
print(f"\n{len(results)-len(fails)}/{len(results)} pruebas OK")
sys.exit(1 if fails else 0)
