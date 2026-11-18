import type { ReactNode } from 'react';
import { errorOf, num, type Section } from '@/lib/types';

export const COLORS = ['#c74634', '#2f6fed', '#1a9b6c', '#d99200', '#7c4dff', '#14a3b8', '#8794a8'];

export const money = (v: unknown) =>
  '$' + num(v).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Kind = 'ok' | 'warn' | 'bad';

export function statusKind(s: string): Kind {
  const good = ['OPEN', 'READ WRITE', 'PAID', 'SHIPPED', 'ONLINE', 'ARCHIVELOG', 'COMPLETED', 'ACTIVE'];
  const warn = ['NEW', 'PENDING', 'MOUNTED', 'READ ONLY', 'NOARCHIVELOG', 'INACTIVE', 'NONE', 'RUNNING'];
  return good.includes(s) ? 'ok' : warn.includes(s) ? 'warn' : 'bad';
}

export function Pill({ text, kind }: { text: string; kind?: Kind }) {
  return <span className={`pill ${kind ?? statusKind(text)}`}>{text}</span>;
}

export function Kpi({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="kpi">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub ? <div className="subtext">{sub}</div> : null}
    </div>
  );
}

/** A card that shows the query's error (if any) instead of the chart/table. */
export function Card({
  title,
  source,
  sections,
  children,
}: {
  title: string;
  source: string;
  sections?: Section[];
  children: ReactNode;
}) {
  const error = (sections ?? []).map(errorOf).find((e) => e);
  return (
    <section className="card">
      <h2>{title}</h2>
      <div className="src">{source}</div>
      {error ? <div className="err">Could not read this data: {error}</div> : children}
    </section>
  );
}

export function Loading() {
  return <div className="empty">Loading...</div>;
}
