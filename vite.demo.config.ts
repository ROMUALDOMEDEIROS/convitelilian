import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Config exclusiva do build de demonstração publicado como página única.
 *  inlineDynamicImports junta os chunks dinâmicos do jsPDF num só arquivo,
 *  porque a página publicada não pode buscar chunks separados. */
export default defineConfig({
  plugins: [react()],
  resolve: {
    // No modo demonstração a folha é desenhada em HTML e o jsPDF nunca roda.
    // Trocando o módulo por um substituto, jspdf, jspdf-autotable, html2canvas
    // e dompurify saem do pacote publicado. A forma de lista com expressão
    // regular é necessária porque o import é escrito como '../lib/pdf'.
    alias: [
      {
        // casa o especificador INTEIRO: com regex, o Vite substitui apenas o
        // trecho correspondente, e um padrão parcial deixaria o '../' na frente
        find: /^.*\/lib\/pdf$/,
        replacement: fileURLToPath(new URL('./src/lib/pdf-stub.ts', import.meta.url)),
      },
    ],
  },
  build: {
    outDir: 'dist-demo',
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
});
