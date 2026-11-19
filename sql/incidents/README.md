# Incident exercises

Two practice incidents. Each has a runbook in [`docs/runbooks/`](../../docs/runbooks/).

| Incident | Scripts | Runbook |
|---|---|---|
| Blocking session | `01_blocking_session_diagnose.sql` (two interactive sessions create the block, see the runbook) | [04-blocking-session.md](../../docs/runbooks/04-blocking-session.md) |
| Tablespace full (ORA-01653) | `02` setup, `03` fill, `04` cleanup | [05-tablespace-full.md](../../docs/runbooks/05-tablespace-full.md) |

Run them only against this lab. Never put passwords in these files. `sqlplus` prompts for them.
