import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Config exclusiva do build de demonstração publicado como página única.
 *  inlineDynamicImports junta os chunks dinâmicos do jsPDF num só arquivo,
 *  porque a página publicada não pode buscar chunks separados. */
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-demo',
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
});
