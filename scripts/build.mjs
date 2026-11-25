// Build mínimo para OlmedoRides.
// Copia SOLO los archivos públicos a dist/ para no exponer sql/, README, etc.
import { rm, mkdir, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const PUBLIC_ITEMS = ['index.html', 'css', 'js', 'pages', '_headers'];

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });

for (const item of PUBLIC_ITEMS) {
    if (!existsSync(item)) {
        console.warn(`Aviso: no se encontró "${item}", se omite.`);
        continue;
    }
    await cp(item, `dist/${item}`, { recursive: true });
}

console.log('✅ Build listo en dist/ (solo frontend público).');
