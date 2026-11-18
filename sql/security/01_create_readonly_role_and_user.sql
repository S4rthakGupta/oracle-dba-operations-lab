-- 01_create_readonly_role_and_user.sql
-- Purpose : Give reporting staff read-only access to the retail tables, and nothing else.
-- Run as  : SYSDBA. Switches into FREEPDB1. Requires the retail tables to exist (sql/schema/03).
-- Secret  : Password is NOT stored here. It is passed in as &rpt_pw at run time.
-- Usage   : read -s "RPT_PW?retail_report password: "; echo
--           (echo "DEFINE rpt_pw=${RPT_PW}"; cat sql/security/01_create_readonly_role_and_user.sql) | \
--             docker exec -i oracle-practice sqlplus -s / as sysdba
--           unset RPT_PW
-- Design  : Privileges go to a ROLE, and the role goes to the user. To change what reporting staff can see,
--           change the role once instead of editing every user.

SET VERIFY OFF
SET LINESIZE 150
COLUMN grantee FORMAT A20
COLUMN table_name FORMAT A15
COLUMN privilege FORMAT A15
COLUMN granted_role FORMAT A20

ALTER SESSION SET CONTAINER = FREEPDB1;

CREATE ROLE retail_readonly;

GRANT SELECT ON retail_app.customers   TO retail_readonly;
GRANT SELECT ON retail_app.products    TO retail_readonly;
GRANT SELECT ON retail_app.orders      TO retail_readonly;
GRANT SELECT ON retail_app.order_items TO retail_readonly;
GRANT SELECT ON retail_app.payments    TO retail_readonly;

CREATE USER retail_report IDENTIFIED BY "&rpt_pw"
  DEFAULT TABLESPACE users
  TEMPORARY TABLESPACE temp;

GRANT CREATE SESSION TO retail_report;
GRANT retail_readonly TO retail_report;

PROMPT === Verify: what the role can do ===
SELECT grantee, table_name, privilege FROM dba_tab_privs WHERE grantee = 'RETAIL_READONLY' ORDER BY table_name;

PROMPT === Verify: who has the role ===
SELECT grantee, granted_role FROM dba_role_privs WHERE granted_role = 'RETAIL_READONLY';
