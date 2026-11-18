'use client';
import { useEffect, useRef, useState } from 'react';
import { Donut, LiveLines, SimpleBars, StackedBars, type Point } from './charts';
import { Card, Kpi, Loading, Pill, COLORS, money, statusKind } from './ui';
import { usePolling } from './usePolling';
import { num, rowsOf, str, type Health, type Live, type Retail } from '@/lib/types';

const round1 = (n: number) => Math.round(n * 10) / 10;

export default function Dashboard() {
  const [paused, setPaused] = useState(false);
  const health = usePolling<Health>('/api/health', 15000, paused);
  const live = usePolling<Live>('/api/live', 3000, paused);
  const retail = usePolling<Retail>('/api/retail', 8000, paused);

  // ---- Turn Oracle's running counters into "per second" rates for the live chart ----
  const [series, setSeries] = useState<Point[]>([]);
  const prev = useRef<{ ts: number; s: Record<string, number> } | null>(null);
  useEffect(() => {
    const d = live.data;
    if (!d) return;
    const stats: Record<string, number> = {};
    for (const r of rowsOf(d.stats)) stats[str(r.name)] = num(r.value);
    if (!Object.keys(stats).length) return;
    const p = prev.current;
    prev.current = { ts: d.ts, s: stats };
    if (!p || d.ts <= p.ts) return;
    const secs = (d.ts - p.ts) / 1000;
    const rate = (k: string) => Math.max(0, (stats[k] ?? 0) - (p.s[k] ?? 0)) / secs;
    setSeries((old) =>
      [
        ...old,
        {
          t: new Date(d.ts).toLocaleTimeString([], { hour12: false }),
          calls: round1(rate('user calls')),
          commits: round1(rate('user commits')),
          reads: round1(rate('physical reads')),
          logical: round1(rate('session logical reads')),
          redoKb: round1(rate('redo size') / 1024),
        },
      ].slice(-40),
    );
  }, [live.data]);

  const h = health.data;
  const l = live.data;
  const r = retail.data;

  const inst = rowsOf(h?.instance)[0];
  const db = rowsOf(h?.database)[0];
  const sessions = rowsOf(l?.sessions);
  const blocked = sessions.filter((s) => s.blocking_session !== null && s.blocking_session !== undefined);
  const kpi = rowsOf(r?.kpis)[0];

  const anyError = health.error || live.error || retail.error;
  const sga = rowsOf(h?.sga);
  const sgaMax = sga.find((x) => str(x.name) === 'Maximum SGA Size');
  const sgaParts = sga
    .filter((x) => str(x.name) !== 'Maximum SGA Size')
    .map((x) => ({ name: str(x.name).replace(' Size', ''), value: num(x.mb) }))
    .sort((a, b) => b.value - a.value);
  const tablespaces = rowsOf(h?.tablespaces).map((x) => ({
    name: str(x.tablespace_name),
    used: num(x.used_mb),
    free: Math.max(0, num(x.allocated_mb) - num(x.used_mb)),
  }));

  return (
    <>
      <header className="topbar">
        <div>
          <h1>RetailDB | Oracle DBA Lab</h1>
          <div className="sub">Oracle 26ai Free in Docker · fictional merchandise-business data · read-only</div>
        </div>
        <div className="right">
          <span className="live">
            <span className={`dot ${paused ? 'off' : anyError ? 'err' : ''}`} />
            {paused ? 'Paused' : anyError ? 'Connection problem' : 'Live · refreshing every few seconds'}
          </span>
          <button className="btn" onClick={() => setPaused((p) => !p)}>{paused ? 'Resume' : 'Pause'}</button>
        </div>
      </header>

      <main className="wrap">
        {blocked.length > 0 && (
          <div className="banner">
            {blocked.length} session{blocked.length > 1 ? 's are' : ' is'} blocked by another session. See the Sessions table.
          </div>
        )}

        <div className="kpis">
          <Kpi label="Instance" value={inst ? <Pill text={str(inst.status)} /> : '...'} sub={inst ? str(inst.instance_name) : undefined} />
          <Kpi label="Database" value={db ? <Pill text={str(db.open_mode)} /> : '...'} sub={rowsOf(h?.container)[0] ? `container ${str(rowsOf(h?.container)[0].con_name)}` : undefined} />
          <Kpi label="Archive mode" value={db ? <Pill text={str(db.log_mode)} /> : '...'} sub="needed for point-in-time recovery" />
          <Kpi label="User sessions" value={l ? sessions.length : '...'} sub={blocked.length ? `${blocked.length} blocked` : 'none blocked'} />
          <Kpi label="Revenue (paid)" value={kpi ? money(kpi.revenue) : '...'} sub={kpi ? `${num(kpi.orders)} orders · ${num(kpi.customers)} customers` : undefined} />
          <Kpi label="Low stock" value={kpi ? num(kpi.low_stock) : '...'} sub="products under 50 units" />
        </div>

        <div className="grid2">
          <Card title="Activity (per second)" source="v$sysstat · sampled every 3 seconds" sections={[l?.stats]}>
            {!l ? <Loading /> : (
              <LiveLines data={series} lines={[
                { key: 'calls', label: 'User calls', color: COLORS[1] },
                { key: 'commits', label: 'Commits', color: COLORS[0] },
              ]} />
            )}
          </Card>
          <Card title="Disk reads and redo (per second)" source="v$sysstat · physical reads and redo generated" sections={[l?.stats]}>
            {!l ? <Loading /> : (
              <LiveLines data={series} lines={[
                { key: 'reads', label: 'Physical reads (disk)', color: COLORS[3] },
                { key: 'redoKb', label: 'Redo generated (KB)', color: COLORS[4] },
              ]} />
            )}
          </Card>
        </div>

        <Card title="Sessions" source="v$session · refreshes every 3 seconds" sections={[l?.sessions]}>
          {!l ? <Loading /> : sessions.length === 0 ? <div className="empty">No user sessions right now.</div> : (
            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    <th className="num">SID</th><th>User</th><th>Status</th><th>Program</th>
                    <th>Blocked by</th><th>Wait event</th><th className="num">Seconds since last call</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => {
                    const isBlocked = s.blocking_session !== null && s.blocking_session !== undefined;
                    return (
                      <tr key={`${s.sid}-${s.serial_no}`} className={isBlocked ? 'blocked' : ''}>
                        <td className="num mono">{str(s.sid)}</td>
                        <td>{str(s.username)}</td>
                        <td><Pill text={str(s.status)} /></td>
                        <td className="trunc mono" title={str(s.program)}>{str(s.program)}</td>
                        <td>{isBlocked ? <Pill text={`SID ${str(s.blocking_session)}`} kind="bad" /> : <span className="empty">-</span>}</td>
                        <td className="trunc" title={str(s.event)}>{str(s.event)}</td>
                        <td className="num">{str(s.last_call_et)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="grid3">
          <Card title="Instance and database" source="v$instance · v$database" sections={[h?.instance, h?.database, h?.container]}>
            {!h ? <Loading /> : (
              <div className="kv">
                <div>Instance</div><div>{str(inst?.instance_name)}</div>
                <div>Status</div><div>{inst ? <Pill text={str(inst.status)} /> : ''}</div>
                <div>Version</div><div>{str(inst?.version)}</div>
                <div>Started</div><div>{str(inst?.startup_time)}</div>
                <div>Database</div><div>{str(db?.name)}</div>
                <div>Open mode</div><div>{db ? <Pill text={str(db.open_mode)} /> : ''}</div>
                <div>Archive mode</div><div>{db ? <Pill text={str(db.log_mode)} /> : ''}</div>
                <div>Container</div><div>{str(rowsOf(h.container)[0]?.con_name)}</div>
              </div>
            )}
          </Card>
          <Card title="Memory (SGA)" source="v$sgainfo" sections={[h?.sga]}>
            {!h ? <Loading /> : sgaParts.length === 0 ? <div className="empty">No SGA data returned.</div> : (
              <>
                <Donut data={sgaParts} />
                {sgaMax ? <div className="empty">Total SGA: {num(sgaMax.mb).toLocaleString()} MB</div> : null}
              </>
            )}
          </Card>
          <Card title="Storage (tablespaces)" source="dba_data_files · dba_free_space" sections={[h?.tablespaces]}>
            {!h ? <Loading /> : <StackedBars data={tablespaces} height={Math.max(180, tablespaces.length * 46)} />}
          </Card>
        </div>

        <div className="grid2">
          <Card title="Orders by status" source="owner RETAIL_APP · orders" sections={[r?.byStatus]}>
            {!r ? <Loading /> : (
              <Donut data={rowsOf(r.byStatus).map((x) => ({ name: str(x.status), value: num(x.cnt) }))} />
            )}
          </Card>
          <Card title="Stock levels" source="owner RETAIL_APP · products" sections={[r?.products]}>
            {!r ? <Loading /> : (
              <SimpleBars data={rowsOf(r.products).map((x) => ({ name: str(x.product_name), value: num(x.stock_quantity) }))} color={COLORS[1]} />
            )}
          </Card>
        </div>

        <Card title="Retail tables" source="owner RETAIL_APP · stored in tablespace RETAIL_DATA" sections={[r?.counts]}>
          {!r ? <Loading /> : (
            <div className="chips">
              {rowsOf(r.counts).map((x) => (
                <div className="chip" key={str(x.table_name)}><b>{num(x.row_count)}</b><span>{str(x.table_name)}</span></div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Orders" source="orders JOIN customers LEFT JOIN payments" sections={[r?.orders]}>
          {!r ? <Loading /> : (
            <div className="scroll">
              <table>
                <thead>
                  <tr><th className="num">Order</th><th>Customer</th><th>Date</th><th>Order status</th><th>Payment</th><th className="num">Total</th></tr>
                </thead>
                <tbody>
                  {rowsOf(r.orders).map((o) => (
                    <tr key={str(o.order_id)}>
                      <td className="num">{str(o.order_id)}</td>
                      <td>{str(o.customer)}</td>
                      <td>{str(o.order_date)}</td>
                      <td><Pill text={str(o.order_status)} kind={statusKind(str(o.order_status))} /></td>
                      <td><Pill text={str(o.payment_status)} kind={statusKind(str(o.payment_status))} /></td>
                      <td className="num">{money(o.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Recent RMAN backups" source="v$backup_set · backup sets visible from this pluggable database" sections={[h?.backups]}>
          {!h ? <Loading /> : rowsOf(h.backups).length === 0 ? (
            <div className="empty">No RMAN backup sets visible yet.</div>
          ) : (
            <table>
              <thead><tr><th>Finished</th><th>What was backed up</th><th className="num">Seconds</th><th className="num">Pieces</th></tr></thead>
              <tbody>
                {rowsOf(h.backups).map((b, i) => (
                  <tr key={i}><td>{str(b.end_time)}</td><td>{str(b.input_type)}</td><td className="num">{str(b.elapsed_seconds)}</td><td className="num">{str(b.pieces)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <div className="foot">
          Read-only dashboard. Every query is a SELECT. Health and activity are read by RETAIL_MONITOR, retail data by RETAIL_APP.
        </div>
      </main>
    </>
  );
}
