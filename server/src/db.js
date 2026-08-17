import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import Database from 'better-sqlite3';

/**
 * Banco local do Registro da Guarda.
 *
 * Um snapshot por (tabela, dia): o auto-save sobrescreve o do dia corrente.
 * Cada gravação também é anexada em `snapshot_version`, para que um auto-save
 * disparado depois de alguém apagar linhas por acidente não faça o conteúdo
 * anterior desaparecer para sempre — num livro de registro isso é essencial.
 */

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS snapshot (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  table_id    TEXT    NOT NULL,
  dia         TEXT    NOT NULL,
  header      TEXT    NOT NULL,
  rows        TEXT    NOT NULL,
  row_count   INTEGER NOT NULL,
  created_at  TEXT    NOT NULL,
  updated_at  TEXT    NOT NULL,
  UNIQUE (table_id, dia)
);

CREATE TABLE IF NOT EXISTS snapshot_version (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_id INTEGER NOT NULL REFERENCES snapshot(id) ON DELETE CASCADE,
  header      TEXT    NOT NULL,
  rows        TEXT    NOT NULL,
  row_count   INTEGER NOT NULL,
  saved_at    TEXT    NOT NULL,
  origem      TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_version_snapshot
  ON snapshot_version (snapshot_id, id DESC);
`;

export function openDatabase(file) {
  // O teste do ":memory:" tem de ser feito ANTES de resolver o caminho: depois
  // do resolve() ele vira ".../server/:memory:" e o banco iria para o disco.
  const emMemoria = file === ':memory:';
  const path = emMemoria ? file : resolve(file);
  if (!emMemoria) mkdirSync(dirname(path), { recursive: true });

  const db = new Database(path);
  db.exec(SCHEMA);

  // Todas as consultas são preparadas com parâmetros ligados: nenhum valor
  // vindo da rede é concatenado em SQL.
  const stmt = {
    upsert: db.prepare(`
      INSERT INTO snapshot (table_id, dia, header, rows, row_count, created_at, updated_at)
      VALUES (@tableId, @dia, @header, @rows, @rowCount, @now, @now)
      ON CONFLICT (table_id, dia) DO UPDATE SET
        header     = excluded.header,
        rows       = excluded.rows,
        row_count  = excluded.row_count,
        updated_at = excluded.updated_at
    `),
    byId: db.prepare(`SELECT id FROM snapshot WHERE table_id = ? AND dia = ?`),
    addVersion: db.prepare(`
      INSERT INTO snapshot_version (snapshot_id, header, rows, row_count, saved_at, origem)
      VALUES (@snapshotId, @header, @rows, @rowCount, @now, @origem)
    `),
    countVersions: db.prepare(
      `SELECT COUNT(*) AS total FROM snapshot_version WHERE snapshot_id = ?`,
    ),
    get: db.prepare(`
      SELECT dia, header, rows, row_count AS rowCount, created_at AS createdAt,
             updated_at AS updatedAt
        FROM snapshot
       WHERE table_id = ? AND dia = ?
    `),
    listDays: db.prepare(`
      SELECT dia, row_count AS rowCount, updated_at AS updatedAt
        FROM snapshot
       WHERE table_id = ?
       ORDER BY dia DESC
       LIMIT ?
    `),
  };

  /** Grava (ou sobrescreve) o snapshot do dia e registra a versão. */
  const save = db.transaction(({ tableId, dia, header, rows, origem }) => {
    const now = new Date().toISOString();
    const headerJson = JSON.stringify(header);
    const rowsJson = JSON.stringify(rows);
    const rowCount = rows.length;

    stmt.upsert.run({ tableId, dia, header: headerJson, rows: rowsJson, rowCount, now });
    const { id } = stmt.byId.get(tableId, dia);
    stmt.addVersion.run({
      snapshotId: id,
      header: headerJson,
      rows: rowsJson,
      rowCount,
      now,
      origem,
    });

    const { total } = stmt.countVersions.get(id);
    return { savedAt: now, rowCount, versao: total };
  });

  function load(tableId, dia) {
    const found = stmt.get.get(tableId, dia);
    if (!found) return null;
    return {
      dia: found.dia,
      header: JSON.parse(found.header),
      rows: JSON.parse(found.rows),
      rowCount: found.rowCount,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
    };
  }

  function listDays(tableId, limit = 60) {
    return stmt.listDays.all(tableId, limit);
  }

  return { db, save, load, listDays, close: () => db.close() };
}
