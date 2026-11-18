-- 04_create_monitor_user.sql
-- Purpose : Create a read-only monitoring account for the dashboard and health checks.
-- Run as  : SYSDBA. Switches into FREEPDB1.
-- Secret  : The password is NOT stored in this file. It is passed in as &mon_pw at run time.
-- Usage   : read -s "MON_PW?retail_monitor password: "; echo
--           (echo "DEFINE mon_pw=${MON_PW}"; cat sql/schema/04_create_monitor_user.sql) | \
--             docker exec -i oracle-practice sqlplus -s / as sysdba
--           unset MON_PW
-- Design  : Can log in and read Oracle's dictionary and performance views (SELECT_CATALOG_ROLE).
--           Cannot read the retail tables, change anything, or create objects. No storage quota.

SET VERIFY OFF
SET LINESIZE 150
COLUMN grantee FORMAT A20
COLUMN granted_role FORMAT A25
COLUMN privilege FORMAT A20

ALTER SESSION SET CONTAINER = FREEPDB1;

CREATE USER retail_monitor IDENTIFIED BY "&mon_pw"
  DEFAULT TABLESPACE users
  TEMPORARY TABLESPACE temp;

GRANT CREATE SESSION TO retail_monitor;
GRANT SELECT_CATALOG_ROLE TO retail_monitor;

PROMPT === Verify: user ===
SELECT username, account_status FROM dba_users WHERE username = 'RETAIL_MONITOR';

PROMPT === Verify: roles ===
SELECT grantee, granted_role FROM dba_role_privs WHERE grantee = 'RETAIL_MONITOR';

PROMPT === Verify: system privileges ===
SELECT grantee, privilege FROM dba_sys_privs WHERE grantee = 'RETAIL_MONITOR';
