// Shared types (no server-only imports, so client components can use them too).

export type Row = Record<string, string | number | null>;

/** One query's outcome: either rows, or an error message. Errors never hide other cards. */
export type Section = { rows: Row[] } | { error: string } | undefined;

export interface Health {
  ts: number;
  instance: Section;
  database: Section;
  container: Section;
  sga: Section;
  tablespaces: Section;
  backups: Section;
}

export interface Live {
  ts: number;
  stats: Section;
  sessions: Section;
}

export interface Retail {
  ts: number;
  kpis: Section;
  byStatus: Section;
  counts: Section;
  orders: Section;
  products: Section;
}

export const rowsOf = (s: Section): Row[] => (s && 'rows' in s ? s.rows : []);
export const errorOf = (s: Section): string | null => (s && 'error' in s ? s.error : null);
export const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
export const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v));
