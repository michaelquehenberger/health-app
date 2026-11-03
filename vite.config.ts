import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json';

// base: './' damit der Build auch aus einem Unterordner (z. B. GitHub Pages) läuft.
// Modus „claude“: alles (Schriften, Bilder) in eine Datei, für die Seite auf claude.ai (npm run build:claude).
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: mode === 'claude'
    ? { outDir: 'dist-claude', assetsInlineLimit: 100_000_000, cssCodeSplit: false, modulePreload: false, rollupOptions: { output: { inlineDynamicImports: true } } }
    : undefined,
}));
