import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';

/**
 * A temporary migration bridge. The original app remains the default entry.
 * Phase 4 bundles index.html with an opt-in Vue island for the app register,
 * plus vue-preview.html. All original legacy JS, CSS, data and docs stay
 * intact in dist/, with the old register retained as an explicit fallback.
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
        'vue-preview': resolve(process.cwd(), 'vue-preview.html')
      }
    }
  }
});
