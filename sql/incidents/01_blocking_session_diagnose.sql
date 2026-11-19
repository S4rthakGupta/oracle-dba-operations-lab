-- 01_blocking_session_diagnose.sql
-- Purpose : Show which sessions are blocked and who is blocking them.
-- Run as  : SYSDBA. Usage:
--           docker exec -i oracle-practice sqlplus -s / as sysdba < sql/incidents/01_blocking_session_diagnose.sql
-- Read-only: it only queries v$session, it changes nothing.

SET LINESIZE 200 PAGESIZE 50
COLUMN waiting_user  FORMAT A14
COLUMN blocking_user FORMAT A14
COLUMN event         FORMAT A32

ALTER SESSION SET CONTAINER = FREEPDB1;

PROMPT === Blocked sessions and their blockers ===
SELECT w.sid              AS waiting_sid,
       w.username         AS waiting_user,
       w.event,
       w.seconds_in_wait,
       b.sid              AS blocking_sid,
       b.serial#          AS blocking_serial,
       b.username         AS blocking_user,
       b.status           AS blocking_status,
       b.last_call_et     AS blocker_idle_secs
  FROM v$session w
  JOIN v$session b ON b.sid = w.blocking_session
 WHERE w.blocking_session IS NOT NULL;
