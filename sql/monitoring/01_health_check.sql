-- 01_health_check.sql
-- Purpose : Morning health check for the RetailDB lab (Oracle 26ai Free, instance FREE).
-- Run as  : SYSDBA, connected to CDB$ROOT.
-- Usage   : docker exec -i oracle-practice sqlplus -s / as sysdba < sql/monitoring/01_health_check.sql
-- Safe    : Read-only. Nothing in this script changes the database.

SET LINESIZE 150 PAGESIZE 100
COLUMN name   FORMAT A70
COLUMN member FORMAT A70

PROMPT === 1. Instance: is it running and open? ===
SELECT instance_name, status FROM v$instance;

PROMPT === 2. Database: open mode and archive mode ===
SELECT name, open_mode, log_mode FROM v$database;

PROMPT === 3. Which container am I in? ===
SHOW CON_NAME

PROMPT === 4. Pluggable databases ===
SELECT name, open_mode FROM v$pdbs;

PROMPT === 5. Memory (SGA) ===
SHOW SGA

PROMPT === 6. Core background processes (ARC0 only runs in ARCHIVELOG mode) ===
SELECT pname, spid FROM v$process
WHERE pname IN ('PMON','SMON','DBW0','LGWR','CKPT','LREG','RECO','ARC0')
ORDER BY pname;

PROMPT === 7. Control files ===
SELECT name FROM v$controlfile;

PROMPT === 8. Online redo log files ===
SELECT member FROM v$logfile;

PROMPT === 9. Datafiles ===
SELECT name FROM v$datafile;
