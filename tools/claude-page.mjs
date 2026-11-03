// Baut aus dist-claude/ eine einzige Seite für claude.ai: Skript und Stile direkt in der Seite.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'dist-claude/assets';
const files = readdirSync(dir);
const js = files.filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(dir, f), 'utf8'));
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(dir, f), 'utf8'));
if (js.length !== 1) throw new Error(`Erwartet genau eine JS-Datei, gefunden: ${js.length}`);
const safeJs = js[0].replace(/<\/script/gi, '<\\/script');
const page = `<title>LIVION Testphase</title>
<style>${css.join('\n')}</style>
<div id="root"></div>
<script type="module">${safeJs}</script>
`;
writeFileSync('dist-claude/livion.html', page);
console.log(`dist-claude/livion.html: ${(page.length / 1024 / 1024).toFixed(2)} MB`);
