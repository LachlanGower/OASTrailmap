import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';

/**
 * The root is Vue-owned. legacy.html is a separate PR #40 comparison entry.
 * Original assets are copied only for that page and public curriculum/docs.
 */
function copyUnchangedLegacySite(): Plugin {
  return {
    name: 'oas-preserve-legacy-site',
    apply: 'build',
    closeBundle() {
      const root = process.cwd();
      const dist = resolve(root, 'dist');
      mkdirSync(dist, { recursive: true });
      for (const relative of ['css', 'js', 'data', 'docs']) {
        const src = resolve(root, relative);
        if (!existsSync(src)) throw new Error('Required legacy path missing: ' + relative);
        cpSync(src, resolve(dist, relative), { recursive: true, force: true });
      }
    }
  };
}

export default defineConfig({
  plugins: [vue(), copyUnchangedLegacySite()],
  publicDir: false,
  // Root locally; repository subpath for optional build/deploy preview.
  base: process.env.OAS_PUBLIC_BASE || '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(process.cwd(), 'index.html'),
        'vue-preview': resolve(process.cwd(), 'vue-preview.html'),
        legacy: resolve(process.cwd(), 'legacy.html')
      }
    }
  }
});
