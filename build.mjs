// Build sin dependencias: copia el sitio estático a dist/ (Node >= 16.7).
import { cpSync, rmSync, mkdirSync, existsSync } from 'node:fs';
const files = ['index.html', 'terminos.html', 'privacidad.html', 'favicon.svg', 'robots.txt', 'sitemap.xml', '_headers', 'assets'];
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
for (const f of files) if (existsSync(f)) cpSync(f, `dist/${f}`, { recursive: true });
console.log('OK → dist/');
