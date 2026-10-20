import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';

/**
 * A temporary migration bridge. The original app remains the default entry.
 * Only vue-preview.html is bundled. The legacy site is copied byte-for-byte
 * into dist/ so neither users nor GitHub Pages change during Phase 2.
 * Remove this bridge only when the migrated UI passes its parity gate.
 */
function copyUnchangedLegacySite(): Plugin {
  return {
    name: 'oas-preserve-legacy-site',
    apply: 'build',
    closeBundle() {
      const root = process.cwd();
      const dist = resolve(root, 'dist');
      mkdirSync(dist, { recursive: true });
      for (const relative of ['index.html', 'css', 'js', 'data', 'docs']) {
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
      input: resolve(process.cwd(), 'vue-preview.html')
    }
  }
});
