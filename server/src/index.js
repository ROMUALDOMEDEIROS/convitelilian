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

const store = openDatabase(DB_FILE);
const app = createApp({ store, allowedOrigins: ALLOWED_ORIGINS });

const server = app.listen(PORT, HOST, () => {
  console.log(`Registro da Guarda — API em http://${HOST}:${PORT}`);
  console.log(`Banco: ${DB_FILE}`);
  console.log(`Origens permitidas: ${ALLOWED_ORIGINS.join(', ') || '(nenhuma)'}`);
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
