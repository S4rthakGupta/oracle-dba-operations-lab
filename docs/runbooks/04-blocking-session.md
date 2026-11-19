# Runbook: blocking session

**Status:** procedure written. Evidence (screenshots) is added to the README once the exercise has been run in this lab.

## What it is
Session A changes a row and does not commit, so it holds a row lock. Session B tries to change the same row and waits. B is the *blocked* session, A is the *blocker*. Readers are not blocked, because Oracle shows them the old version from undo.

## Symptoms
- Users report that a screen or job hangs.
- Dashboard shows a blocked session. `v$session.blocking_session` is not null and the wait event is `enq: TX - row lock contention`.

## Diagnose
```sql
SELECT w.sid AS waiting_sid, w.username AS waiting_user, w.event, w.seconds_in_wait,
       b.sid AS blocking_sid, b.serial# AS blocking_serial, b.username AS blocking_user,
       b.status AS blocking_status, b.last_call_et AS blocker_idle_secs
  FROM v$session w JOIN v$session b ON b.sid = w.blocking_session
 WHERE w.blocking_session IS NOT NULL;
```
Questions to answer: who is the blocker, what is it doing, and how long has it been idle? A blocker that is `INACTIVE` for a long time usually has an open transaction nobody finished.

## Reproduce (lab)
1. Tab A as `retail_app`: `UPDATE products SET stock_quantity = stock_quantity - 1 WHERE product_id = 1;` (do not commit).
2. Tab B as `retail_app`: the same row with `- 5`. It hangs.
3. Run the diagnose query as SYSDBA in `FREEPDB1`.

## Resolve
1. **Preferred:** ask the blocker's owner to `COMMIT` or `ROLLBACK`. The blocked session then continues by itself.
2. **Last resort, with approval:** `ALTER SYSTEM KILL SESSION 'sid,serial#' IMMEDIATE;` This ends the blocker and **rolls back its uncommitted work**. Confirm what it was doing first.
3. Verify: the diagnose query returns no rows and the dashboard banner is gone.

## Prevent
- Keep transactions short, commit promptly, never leave a session idle mid-transaction.
- Index foreign key columns (unindexed foreign keys cause extra locking).
- Use `SELECT ... FOR UPDATE NOWAIT`, `WAIT n` or `SKIP LOCKED` where the application can handle a refusal.
- Set application timeouts.

## Related: deadlock
Two sessions each wait for a lock the other holds. Oracle detects it, rolls back one statement and raises ORA-00060. The fix is consistent lock ordering in the application.
