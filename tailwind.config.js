/** Solo para "Pasar a producción" (README). Mismos tokens que el <script> inline de index.html. */
module.exports = {
  content: ['./*.html', './assets/*.js'], // app.js genera clases en plantillas de texto: debe estar aquí
  theme: { extend: {
    colors: { brand: { gold: '#d4af37', turquoise: '#06b6d4' } },
    fontFamily: { serif: ['"Playfair Display"', 'Georgia', 'serif'], sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] }
  } }
};
