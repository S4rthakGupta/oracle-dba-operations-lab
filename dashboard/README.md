# RetailDB Dashboard

A live, read-only dashboard for the Oracle DBA operations lab. Next.js (App Router, TypeScript) + Recharts + the `oracledb` driver in thin mode (no Oracle client install needed).

All data is fictional. Every query is a `SELECT` (see `src/lib/queries.ts`).

## How it works

```
Browser  --polls every 3 to 15 s-->  Next.js API routes  --oracledb-->  Oracle (FREEPDB1)
  charts                              /api/health   (RETAIL_MONITOR)
  tables                              /api/live     (RETAIL_MONITOR)
                                      /api/retail   (RETAIL_APP)
```

- **Two accounts, least privilege.** `RETAIL_APP` reads the retail tables. `RETAIL_MONITOR` has only `SELECT_CATALOG_ROLE`, so it can read Oracle's health views and nothing else.
- **Each query runs on its own.** If one view fails, only that card shows an error.
- **Live charts.** `v$sysstat` holds running totals. The page samples them every 3 seconds and charts the difference per second.
- **Sessions table.** Shows `v$session`. A blocked session is highlighted, which makes the blocking-sessions incident visible.
- **Local only.** The server binds to `127.0.0.1`. Only GET requests are handled.

## Run it

```bash
cd dashboard
npm install
cp .env.example .env.local     # then add your two lab passwords
npm run dev                    # http://localhost:3000
```

Passwords live in `.env.local`, which git ignores. Prerequisites: the retail tables (`sql/schema/03`) and the monitoring user (`sql/schema/04`).
