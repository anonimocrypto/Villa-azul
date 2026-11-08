# Auditoría destructiva · Villa Azul Caribe (landing)

**Fecha:** 7-nov-2026 · **Archivos revisados:** los 13 del zip (el sitio real es `index.html`, 1 763 líneas; `src/`, React, Express y Gemini son andamiaje que nunca se usa).
**Veredicto:** como **demo de ventas**, 7/10: el concepto (cotizador + WhatsApp + intro con cursores) vende. Como **sitio publicable para un cliente real**, 3/10: tiene un fallo que lo deja muerto si cae un CDN, un cotizador con 6 errores de cálculo/UX, y contenido inventado (urgencia, reseñas, rating) que es un riesgo legal para tu cliente y para ti.

Los hallazgos marcados **[repro]** los reproduje en Chromium contra el archivo original (no son opinión). Los de la versión corregida están cubiertos por `tests/run-tests.py` (46 pruebas, todas pasan).

---

## 1. Críticos (rompen el negocio o exponen a responsabilidad)

| # | Hallazgo | Evidencia / impacto | Estado |
|---|---|---|---|
| C1 | **Fallo en cascada** **[repro]** | Si `cdn.tailwindcss.com` o `cdnjs` fallan (adblock, red lenta, país con bloqueos, caída), `initIntroAnimation()` lanza `gsap is not defined`, aborta el `DOMContentLoaded` y **nada más se inicializa**: galería = 0, FAQ = 0, reseñas = 0, cotizador sin lógica. Además el overlay `fixed inset-0 z-[100]` **tapa la página para siempre**. | ✅ Cada módulo va aislado en `try/catch`; la intro se omite si no hay GSAP; *watchdog* de 7,5 s; el overlay solo existe si JS lo activa. Pruebas T1, T12. |
| C2 | **"Ver disponibilidad" miente** | No existe calendario ni control de fechas ocupadas (la sección 7 fue borrada; quedan restos: clave `nav_calendar`, comentarios "8, 9, 10…"). El CTA principal promete algo que el sitio no hace y el cotizador cotiza fechas que pueden estar ocupadas. | ✅ `blockedRanges` en config: las fechas por defecto saltan lo ocupado, y cotizar noches bloqueadas muestra aviso y cambia el botón a "Consultar alternativas". ⚠️ Falta alimentarlo desde el `.ics` real (ver §6). CTA renombrado a "Cotizar mis fechas". Pruebas T10. |
| C3 | **Urgencia y métricas inventadas** | "Solo quedan 2 fechas libres en diciembre" (estático, igual para todos), "respuesta en <15 min", "68 reseñas verificadas", "4.98", "Más de 65 estancias" (65 ≠ 68, ni en la misma página coinciden). Es publicidad engañosa y, en Meta/Google Ads, motivo de rechazo. | ✅ Eliminados. `urgency`, `responseTime` y `rating` son `null` en config y solo se muestran con datos reales. |
| C4 | **Reseñas y `aggregateRating` fabricados** | Nombres/ciudades/fechas inventados (y de 2024: en nov-2026 parecen viejas). Un `aggregateRating` falso en schema.org puede acarrear acción manual de Google; reseñas falsas también chocan con la regla de la FTC de 2024 (si vendes a EE. UU.) y con la ley de consumidor dominicana. | ✅ `demoMode:true` etiqueta cada reseña como "Ejemplo" y **no publica** aggregateRating; con `demoMode:false` solo sale si pones datos reales. |
| C5 | **Fotos de stock presentadas como la villa** | `alt="Villa Azul Caribe Infinity Pool…"`, pies de foto como "Terraza con Fogata" o "Master Suite… Vista al Mar" sobre fotos de Unsplash que no son la propiedad. Además hotlinking: si Unsplash cambia/borra un ID, el hueco queda roto. | 🟡 Alts y títulos neutros + nota visible "Fotos de ejemplo". ⚠️ **Hay que poner fotos reales** (y alojarlas tú). |
| C6 | **Contradicciones factuales** | "frente al mar / frente al Atlántico" vs "a 5 min de la playa"; la marca dice *Caribe* pero Puerto Plata está en la costa **Atlántica** (el propio sitio lo dice en otro bloque); "Playa Dorada / Costambar a 5 min a pie" son dos zonas distintas a varios km; "WiFi Starlink **300 Mbps simétricos**" (Starlink no es simétrico); "eventos de hasta 25 personas" con capacidad de 10; cancelación sin regla para <15 días; "confirmación instantánea" cuando responde una persona. | ✅ Textos corregidos / neutralizados. ⚠️ Cada dato dudoso quedó marcado `// VERIFICAR` en `villa.config.js` (distancias, velocidad, generador, política <15 días, límite de visitantes). |
| C7 | **Cotizador con 6 bugs** | **(a) [repro]** Fecha por defecto en UTC: a las 9:30 pm en RD "mañana" era pasado mañana. **(b) [repro]** Salida anterior a la llegada → se cobra 1 noche en silencio ($525) y el mensaje de WhatsApp sale con salida < llegada. **(c) [repro]** Las experiencias **nunca sumaban**: `selectedExperiences` siempre vacío, no hay botón ni función `toggleExperience` (restos de una versión anterior; el título de la sección decía "add to quote"). **(d)** El chef "/día" no se multiplicaba por noches; el traslado "por trayecto" no contemplaba ida y vuelta. **(e)** `toLocaleString()` sin locale: "$1.380" vs "$1,380" según el visitante. **(f)** Fechas `dd/mm/aaaa` en el mensaje: un huésped de EE. UU. lee 08/11 como 11 de agosto. Además `$120` y `10 %` estaban escritos a mano en el texto, no en config. | ✅ Todo corregido (T2, T3, T4, T5): hoy se calcula en la zona de la villa, estadía mínima visible, extras funcionales con multiplicadores, `en-US` fijo, fechas con el mes escrito, todo desde config. |
| C8 | **El botón "¿Dudas?" enviaba una reserva** | `launchFloatingWhatsApp() { launchBookingWhatsApp() }`: quien solo quería preguntar mandaba "quiero reservar" con fechas y total. Igual el CTA del hero "Consultar". | ✅ Tres intenciones distintas: `booking`, `inquiry`, `offer`. |
| C9 | **Marcadores de posición en producción** | Teléfono `+1 (809) 000-0000` copiado a mano en el footer *aparte* del número de config (dos fuentes que se desincronizan); email en un dominio no verificado. | ✅ Una sola fuente (`config.contact`). ⚠️ Reemplazar los valores. |

## 2. Seguridad

| # | Hallazgo | Estado |
|---|---|---|
| S1 | Sin CSP ni cabeceras de seguridad; 20+ `onclick="…"` inline impiden una CSP estricta. | ✅ Handlers movidos a `addEventListener`; `_headers` con HSTS, nosniff, frame-deny, Permissions-Policy y CSP en **modo reporte**. ⚠️ Mientras uses Tailwind por CDN la CSP necesita `unsafe-inline`/`unsafe-eval`; se cierra al compilar el CSS (§6). |
| S2 | Tailwind *Play CDN* en producción (compila en el navegador del visitante, ~300 KB, y es un tercero ejecutando JS con acceso total a la página) + GSAP sin SRI. | 🟡 `ScrollTrigger` (nunca registrado ni usado) eliminado; `tailwind.config.js` + `npm run build:css` listos. ⚠️ No pude generar hashes SRI ni probar el build (sin red en mi entorno). |
| S3 | **XSS latente**: ~15 plantillas con `innerHTML` y datos sin escapar. Hoy los datos son tuyos (riesgo bajo), pero tu modelo de negocio es una **plantilla reutilizable con config editable por clientes**: ahí se vuelve XSS almacenado. | ✅ Todo pasa por `esc()`. Prueba T14 inyecta `<img onerror>` y `<script>` vía config: no ejecuta nada. |
| S4 | iframe de Google Maps siempre cargado, sin `sandbox`, `referrerpolicy` laxo; mapa con un pin "Villa Azul Caribe" que da a entender dirección exacta. | ✅ Carga bajo clic, `sandbox`, `strict-origin-when-cross-origin`, etiqueta "Zona aproximada". |
| S5 | Google Fonts por hotlink: envía la IP del visitante a Google (en 2022 un tribunal de Múnich lo sancionó). | ⚠️ Pendiente: descargar las fuentes a `assets/fonts` (requiere red). Comentario `TODO` en el HTML. |
| S6 | Proyecto: `express`, `dotenv`, `@google/genai`, React, motion, lucide… sin usar; `.env.example` con `GEMINI_API_KEY`; `metadata.json` pide capacidad Gemini en servidor. `index.html` ni siquiera monta React (no hay `#root` ni `<script type=module>`). `bun.lock` junto a un README que dice `npm`. Superficie de ataque y riesgo de filtrar una clave el día que alguien lo conecte. | ✅ Eliminado: ahora es un sitio estático sin dependencias de runtime. |
| S7 | Footer: "Términos", "Privacidad" y "Cancelación" apuntan todos a `#faq`. No existen. | 🟡 `terminos.html` y `privacidad.html` como **plantillas** (⚠️ las debe revisar un abogado; mencionan Ley 172-13 y RGPD solo como recordatorio). |

## 3. SEO

- **Todo lo importante lo inyecta JS** (FAQ, reseñas, galería, experiencias) y el inglés **no existe en el HTML** (se cambia con `textContent`): para un buscador o un crawler de IA que no ejecute JS, la página es el hero y el footer. 🟡 Mejorado (schema `LodgingBusiness` + `FAQPage` generados desde config); ⚠️ lo correcto es **pre-renderizar** y tener `/en/` con `hreflang` (§6).
- JSON-LD `VacationRental` incompleto para lo que Google documenta (falta `containsPlace`, identificador, lat/long en raíz, ≥8 imágenes) y con datos falsos. ✅ Sustituido; valida en el *Rich Results Test* antes de publicar (no pude).
- Faltaban `canonical`, `og:locale`, `theme-color`, favicon, `robots.txt`, `sitemap.xml`. ✅ Añadidos. `meta keywords` (obsoleto) eliminado. `og:image` sigue siendo stock ⚠️ (necesita una imagen 1200×630 propia).
- `bg-radial` es sintaxis de Tailwind **v4** corriendo sobre el CDN **v3**: la viñeta del hero nunca se pintaba. ✅ Reescrita con valor arbitrario.
- Mientras `demoMode` sea `true` el sitio lleva `noindex` a propósito (para que el contenido de ejemplo no se indexe). **Quitarlo al publicar.**

## 4. Rendimiento

- **Intro de 5 s bloqueante en cada carga** (`window.__villaIntroPlayed` se pierde al recargar; no hay `sessionStorage`) y arranca *después* del primer pintado → parpadeo del contenido antes de ocultarse. ✅ La intro se **conserva** (es parte del concepto) pero: decide antes del primer pintado, una vez por sesión, saltable desde el segundo 0, respeta `prefers-reduced-motion`, fondo `inert`, y su texto de relleno "Construyendo tu experiencia en vivo" (sonaba a mensaje de desarrollador) ahora es el eslogan de la villa.
- Hero a 2000 px q85 sin `srcset`/`preload`; galería a 1200 px q85 para tarjetas de ~256 px sin `width/height` (CLS). ✅ `srcset` 400/800, hero con preload y `fetchpriority`, dimensiones declaradas.
- El `finishIntro` dejaba `transform:none` **inline** en las tarjetas, lo que anulaba su efecto `:hover`. ✅ `clearProps` devuelve el control al CSS (probado con GSAP simulado, ver §7).
- No toqué: `backdrop-filter` en muchas tarjetas (pesado en móviles gama baja).

## 5. Accesibilidad y UX

| Problema (original) | Estado |
|---|---|
| Galería con `<div onclick>`: imposible por teclado; lightbox sin rol, sin foco atrapado, sin swipe. | ✅ Botones reales + `<dialog>` nativo (foco, Esc, flechas, swipe). |
| **Bug del Esc** **[repro por lectura]**: el listener usa `{ once: true }`, así que la primera tecla —cualquiera, p. ej. Tab— lo consume y Esc deja de saltar la intro (justo lo que dice el botón). | ✅ T11 |
| FAQ sin `aria-expanded`; se **cierra** al cambiar de idioma. Selector de idioma sin `aria-pressed`; `<html lang>` no cambia. Menú móvil sin estado. | ✅ `<details>` nativo, `lang` dinámico, aria en todo. |
| **Inglés roto ≈ 50 %**: las tarjetas de servicios no tienen claves en el diccionario; reseñas, pies de foto, distancias, footer, opciones del selector, mensajes de intro… siempre en español. Al volver a ES se destruía el degradado dorado del titular (`textContent` sobre HTML). | ✅ Diccionario completo + prueba de paridad ES/EN (T7, T15). Idioma auto-detectado y recordado. |
| Texto de 10–11 px; `text-neutral-500` ≈ 4,2:1 sobre el fondo (falla AA); `gold-gradient-text` sin color de respaldo; inputs `date` sin `color-scheme: dark` (icono del calendario invisible). | ✅ Mínimo 12 px, tonos más claros, `color-scheme`, color de respaldo. |
| Sin *skip link*, sin `<main>`, sin foco visible; anclas tapadas por el header fijo (sin `scroll-padding`). | ✅ |
| El cotizador —tu herramienta de conversión— quedaba **bajo el pliegue** (`min-h-screen`). | 🟡 Hero a 88 svh: asoma. Podrías pegarlo al hero en móvil (decisión de diseño). |
| Las 4 experiencias no tenían ninguna acción (callejón sin salida). | ✅ Botón "Añadir a mi cotización". |
| Un solo canal (WhatsApp); email y teléfono no eran enlaces. | ✅ `mailto:`/`wa.me` reales como `<a href>` (clic medio, copiar enlace). ⚠️ Un formulario/email alternativo sigue pendiente. |
| La cotización no mostraba base, desglose, impuestos ni el depósito de USD 300. | ✅ Desglose + aviso. ⚠️ **Impuestos:** no sé qué aplica a tu cliente (ITBIS/tasas); consúltalo con su contador. |

## 6. Pendientes que no pude hacer (necesitan tu máquina, red o una decisión)

1. **Fotos reales**, `og-image.jpg` propio, y fuentes auto-alojadas.
2. **Disponibilidad real:** exporta el `.ics` de Airbnb/Booking y conviértelo en `blockedRanges` (una función serverless o un script que corra cada hora). Es **la** función que hace que esto "venda" en vez de solo "informar".
3. **Compilar Tailwind** (`npm i && npm run build:css`, cambiar el `<script>` del CDN por `<link href="assets/tailwind.css">`), luego endurecer el CSP y pasar de *Report-Only* a enforcing. **No probé este paso.**
4. **Pre-renderizar** FAQ/reseñas/experiencias y crear `/en/` con `hreflang`.
5. **Analítica:** pega GA4/Plausible en el hueco marcado; los eventos `whatsapp_click`, `quote_changed`, `experience_added`, `gallery_open`, `lang_change` ya se emiten. Sin esto no puedes demostrarle a la villa cuántas consultas generó la web.
6. **Datos del dueño** (todo `// VERIFICAR` en `villa.config.js`): distancias reales, velocidad de internet, generador, mascotas, límite de visitantes, política <15 días, mínimo de noches, perks ("cóctel de cortesía"), impuestos.
7. **Revisión legal** de términos y privacidad.
8. Sin pruebas de **Lighthouse/axe**, sin *Rich Results Test*, sin prueba en Safari/Firefox ni en un móvil real.

## 7. Qué verifiqué y qué no

- ✅ **Navegador real (Chromium + Playwright):** reproduje en el original C1, C7a, C7b, C7c; y en la versión nueva pasan 46/46 pruebas (cotizador, fechas, extras, mensajes de WhatsApp, ES/EN, FAQ, lightbox, bloqueos, intro, *watchdog*, reduced-motion, XSS, paridad i18n, detección de idioma).
- ⚠️ **No pude ver el sitio estilizado**: mi entorno no tiene red, así que Tailwind no carga y no hay captura visual válida. Revisa el diseño tú en el navegador.
- ⚠️ **La animación de la intro con GSAP real tampoco**: probé el control (saltar, Esc, *watchdog*, limpieza de estilos) con un GSAP simulado. La coreografía la conservé tal cual, pero míralo una vez.

## 8. Lo que está bien (para no tirar lo bueno)

Idea bilingüe, objeto de configuración, mensaje de WhatsApp prellenado con el total, gancho del 10 % directo, `rel="noopener noreferrer"` en enlaces externos, chequeo de `prefers-reduced-motion`, y el `README` de intención "fácil de editar para cualquier propiedad" (ahora sí lo es: un archivo).
