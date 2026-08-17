import express from 'express';
import { ConflitoDeVersao } from './db.js';
import {
  ValidationError,
  assertDia,
  assertListasBody,
  assertSnapshotBody,
  assertTableId,
} from './validate.js';

/** Corpo máximo aceito. 5000 linhas × 500 chars não chegam perto disso. */
const BODY_LIMIT = '2mb';

/** Janela e teto do limitador simples por IP. */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 240;

/** Limitador de taxa em memória, sem dependência: barra cliente em loop
 *  que martelaria o banco. 240/min é folgado para 2 tabelas a cada 20 min. */
function rateLimiter({ windowMs = RATE_WINDOW_MS, max = RATE_MAX } = {}) {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip ?? 'desconhecido';
    const entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      entry.count += 1;
      if (entry.count > max) {
        res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
        return res.status(429).json({ erro: 'muitas requisições; tente novamente em instantes' });
      }
    }

    // limpeza preguiçosa das janelas expiradas
    if (hits.size > 1000) {
      for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
    }
    return next();
  };
}

/** CORS restrito: só reflete origens explicitamente permitidas. */
function cors(allowedOrigins) {
  const allowed = new Set(allowedOrigins);

  return (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowed.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Max-Age', '600');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  };
}

export function createApp({ store, allowedOrigins = [], logger = console }) {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', false);

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  app.use(cors(allowedOrigins));
  app.use(rateLimiter());
  app.use(express.json({ limit: BODY_LIMIT }));

  // Log sem corpo: os registros trazem nome de aluno e matrícula, e isso não
  // deve acabar em arquivo de log.
  app.use((req, res, next) => {
    const started = Date.now();
    res.on('finish', () => {
      logger.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - started}ms`);
    });
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, servico: 'registro-guarda', hora: new Date().toISOString() });
  });

  app.get('/api/listas', (_req, res, next) => {
    try {
      res.json({ ok: true, ...store.loadListas() });
    } catch (error) {
      next(error);
    }
  });

  app.put('/api/listas', (req, res, next) => {
    try {
      const { listas, baseVersao, forcar } = assertListasBody(req.body);
      const result = store.saveListas({ listas, baseVersao, forcar });
      res.json({ ok: true, ...result });
    } catch (error) {
      if (error instanceof ConflitoDeVersao) {
        // 409 devolve o estado atual, para a tela poder mostrar a diferença
        return res.status(409).json({ erro: error.message, ...error.atual });
      }
      return next(error);
    }
  });

  app.put('/api/snapshot/:tableId', (req, res, next) => {
    try {
      const tableId = assertTableId(req.params.tableId);
      const { dia, header, rows, origem } = assertSnapshotBody(req.body);
      const result = store.save({ tableId, dia, header, rows, origem });
      res.json({ ok: true, tableId, dia, ...result });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/snapshot/:tableId', (req, res, next) => {
    try {
      const tableId = assertTableId(req.params.tableId);
      const dia = assertDia(req.query.dia);
      const snapshot = store.load(tableId, dia);
      if (!snapshot) {
        return res.status(404).json({ erro: `nenhum registro gravado para ${dia}` });
      }
      return res.json({ ok: true, tableId, ...snapshot });
    } catch (error) {
      return next(error);
    }
  });

  app.get('/api/snapshot/:tableId/dias', (req, res, next) => {
    try {
      const tableId = assertTableId(req.params.tableId);
      res.json({ ok: true, tableId, dias: store.listDays(tableId) });
    } catch (error) {
      next(error);
    }
  });

  app.use((_req, res) => res.status(404).json({ erro: 'rota não encontrada' }));

  // eslint-disable-next-line no-unused-vars -- o Express exige os 4 parâmetros
  app.use((error, _req, res, _next) => {
    if (error instanceof ValidationError) {
      return res.status(error.status).json({ erro: error.message });
    }
    if (error?.type === 'entity.too.large') {
      return res.status(413).json({ erro: `corpo acima do limite de ${BODY_LIMIT}` });
    }
    if (error instanceof SyntaxError) {
      return res.status(400).json({ erro: 'JSON inválido' });
    }
    logger.error('erro inesperado:', error?.message);
    return res.status(500).json({ erro: 'erro interno' });
  });

  return app;
}
