import oracledb from 'oracledb';
import type { Row, Section } from './types';

export type Who = 'app' | 'monitor';

// Keep one small connection pool per account, and survive hot reloads in dev.
const g = globalThis as unknown as { __oraPools?: Partial<Record<Who, Promise<oracledb.Pool>>> };
g.__oraPools ??= {};

function credentials(who: Who) {
  const user = who === 'monitor' ? process.env.MON_USER : process.env.APP_USER;
  const password = who === 'monitor' ? process.env.MON_PASSWORD : process.env.APP_PASSWORD;
  const connectString = process.env.DB_CONNECT || 'localhost:1521/FREEPDB1';
  if (!user || !password) {
    throw new Error(`Missing ${who === 'monitor' ? 'MON' : 'APP'}_USER / _PASSWORD in dashboard/.env.local`);
  }
  return { user, password, connectString };
}

function getPool(who: Who): Promise<oracledb.Pool> {
  const pools = g.__oraPools!;
  if (!pools[who]) {
    const p = oracledb
      .createPool({ ...credentials(who), poolMin: 0, poolMax: 3, poolTimeout: 60 })
      .catch((e) => {
        delete pools[who]; // let the next request retry (e.g. after Oracle finishes starting)
        throw e;
      });
    pools[who] = p;
  }
  return pools[who]!;
}

function lowerKeys(row: Record<string, unknown>): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    out[k.toLowerCase()] = v === null || typeof v === 'number' || typeof v === 'string' ? v : String(v);
  }
  return out;
}

/** Runs each query separately. A failing query becomes { error } for that card only. */
export async function runQueries(who: Who, queries: Record<string, string>): Promise<Record<string, Section>> {
  const out: Record<string, Section> = {};
  let conn: oracledb.Connection;
  try {
    conn = await (await getPool(who)).getConnection();
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    for (const key of Object.keys(queries)) out[key] = { error };
    return out;
  }
  try {
    for (const [key, sql] of Object.entries(queries)) {
      try {
        const res = await conn.execute<Record<string, unknown>>(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        out[key] = { rows: (res.rows ?? []).map(lowerKeys) };
      } catch (e) {
        out[key] = { error: e instanceof Error ? e.message : String(e) };
      }
    }
  } finally {
    await conn.close().catch(() => undefined);
  }
  return out;
}
