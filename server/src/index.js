import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { createApp } from './app.js';
import { openDatabase } from './db.js';

const PORT = Number(process.env.PORT ?? 4000);
/** 0.0.0.0 para as máquinas da portaria alcançarem pela rede interna. */
const HOST = process.env.HOST ?? '0.0.0.0';
const DB_FILE = process.env.DB_FILE ?? 'data/registro.sqlite';

/** Origens autorizadas a chamar a API. Ajuste com ALLOWED_ORIGINS
 *  (separadas por vírgula) quando o frontend for servido de outra máquina. */
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://localhost:5177'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

/** Pasta do app pronto (frontend compilado). Quando existe, este servidor
 *  entrega o app e a API juntos na mesma porta. */
const STATIC_DIR =
  process.env.STATIC_DIR ?? fileURLToPath(new URL('../../dist', import.meta.url));

const store = openDatabase(DB_FILE);
const app = createApp({
  store,
  allowedOrigins: ALLOWED_ORIGINS,
  staticDir: STATIC_DIR,
});

const server = app.listen(PORT, HOST, () => {
  const temApp = existsSync(STATIC_DIR);
  console.log('====================================================');
  console.log(' Registro da Guarda');
  console.log(`   Abra no navegador:  http://localhost:${PORT}`);
  if (!temApp) {
    console.log('   (app ainda não compilado — rode "npm run build" na raiz)');
  }
  console.log(`   Banco de dados:    ${DB_FILE}`);
  console.log('====================================================');
});

function shutdown(signal) {
  console.log(`\n${signal} recebido, encerrando...`);
  server.close(() => {
    store.close();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
