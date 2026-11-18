-- 02_create_app_user.sql
-- Purpose : Create the retail application's schema owner with least privilege.
-- Run as  : SYSDBA. Switches into FREEPDB1.
-- Secret  : The password is NOT stored in this file. It is passed in as &app_pw at run time.
-- Usage   : (echo "DEFINE app_pw=<your-password>"; cat sql/schema/02_create_app_user.sql) | \
--             docker exec -i oracle-practice sqlplus -s / as sysdba
-- Design  : Own tablespace, a 500 MB quota, and only the privileges needed to build the app's objects.
--           No DBA role, no RESOURCE role, no UNLIMITED TABLESPACE.

SET VERIFY OFF
SET LINESIZE 150
COLUMN username FORMAT A15
COLUMN default_tablespace FORMAT A20
COLUMN tablespace_name FORMAT A20
COLUMN privilege FORMAT A25

ALTER SESSION SET CONTAINER = FREEPDB1;

CREATE USER retail_app IDENTIFIED BY "&app_pw"
  DEFAULT TABLESPACE retail_data
  TEMPORARY TABLESPACE temp
  QUOTA 500M ON retail_data;

GRANT CREATE SESSION, CREATE TABLE, CREATE VIEW, CREATE SEQUENCE TO retail_app;

PROMPT === Verify: user ===
SELECT username, account_status, default_tablespace FROM dba_users WHERE username = 'RETAIL_APP';

PROMPT === Verify: storage quota ===
SELECT username, tablespace_name, max_bytes/1024/1024 AS quota_mb FROM dba_ts_quotas WHERE username = 'RETAIL_APP';

PROMPT === Verify: system privileges ===
SELECT grantee, privilege FROM dba_sys_privs WHERE grantee = 'RETAIL_APP' ORDER BY privilege;
