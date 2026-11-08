# Villa Azul Caribe · landing (versión corregida)

Sitio **estático** (sin backend, sin claves). Léete primero `AUDITORIA.md`.

## Ejecutar
```
npm run dev      # sirve la carpeta en http://localhost:3000
npm run build    # copia el sitio a dist/ (comando de build en Vercel/Netlify; carpeta de salida: dist)
npm test         # 46 pruebas en Chromium (pip install playwright && playwright install chromium)
```

## Personalizar para otra villa
Edita **solo** `assets/villa.config.js` (datos, precios, fotos, reseñas, FAQ, ES/EN) y, si hace falta, `assets/i18n.js` (textos de interfaz). Cambia también `<title>`, `canonical` y `og:*` en `index.html`.

## Antes de publicar (checklist)
- [ ] `demoMode:false`, quitar `<meta name="robots" content="noindex">`
- [ ] Reemplazar todo lo marcado `// VERIFICAR` y el teléfono/email de ejemplo
- [ ] Fotos reales + `og-image` propia
- [ ] Reseñas y `rating` reales (o dejarlos vacíos / `null`)
- [ ] Cargar `blockedRanges` desde el calendario real
- [ ] Revisión legal de `terminos.html` y `privacidad.html`
- [ ] Pegar analítica (eventos ya emitidos)
- [ ] Tailwind compilado (`npm i && npm run build:css`, cambiar el `<script>` CDN por `<link href="assets/tailwind.css">`) y CSP en modo enforcing (`_headers`)
