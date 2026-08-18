import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Em desenvolvimento (npm run dev na porta 5173), encaminha as chamadas de
    // API para o backend na 4000, para o cliente poder usar caminhos relativos
    // (/api/...) igual em produção.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
