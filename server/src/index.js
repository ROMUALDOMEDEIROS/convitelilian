import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { createApp } from './app.js';
import { openDatabase } from './db.js';
import { arquivarEExpurgar, RETENCAO_DIAS } from './arquivo.js';

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

/** Onde ficam os PDFs dos dias que saíram do banco. */
const ARQUIVO_DIR =
  process.env.ARQUIVO_DIR ?? fileURLToPath(new URL('../arquivo', import.meta.url));

/** Dias mantidos no banco, contando o de hoje. 0 desliga o expurgo. */
const RETENCAO = Number(process.env.RETENCAO_DIAS ?? RETENCAO_DIAS);

/** De quanto em quanto tempo reconferir. Seis horas cobre a virada do dia numa
 *  máquina que fica ligada semanas seguidas, sem ficar acordando à toa. */
const INTERVALO_ARQUIVAMENTO_MS = 6 * 60 * 60 * 1000;

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
  if (RETENCAO > 0) {
    console.log(`   Guarda ${RETENCAO} dias; os anteriores viram PDF em: ${ARQUIVO_DIR}`);
  }
  console.log('====================================================');
});

/** Arquiva os dias vencidos. Nunca derruba o servidor: um erro aqui vira aviso
 *  no log e o dia continua no banco, para a próxima passada tentar de novo. */
function passarOArquivamento() {
  if (RETENCAO <= 0) return;
  try {
    arquivarEExpurgar({ store, pasta: ARQUIVO_DIR, dias: RETENCAO });
  } catch (erro) {
    console.error('[arquivo] a passagem falhou por inteiro:', erro.message);
  }
}

passarOArquivamento();
const relogioDoArquivamento = setInterval(passarOArquivamento, INTERVALO_ARQUIVAMENTO_MS);
// não segura o processo vivo só por causa do timer
relogioDoArquivamento.unref();

function shutdown(signal) {
  console.log(`\n${signal} recebido, encerrando...`);
  server.close(() => {
    store.close();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
