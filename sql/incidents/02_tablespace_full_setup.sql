-- 02_tablespace_full_setup.sql
-- Purpose : Create a deliberately tiny tablespace so we can reproduce ORA-01653 safely.
-- Run as  : SYSDBA. Usage:
--           docker exec -i oracle-practice sqlplus -s / as sysdba < sql/incidents/02_tablespace_full_setup.sql
-- Safe    : Uses a separate throwaway tablespace (incident_ts), never RETAIL_DATA.
-- Cleanup : see 04_tablespace_full_cleanup.sql

SET LINESIZE 150
ALTER SESSION SET CONTAINER = FREEPDB1;
SHOW CON_NAME

CREATE TABLESPACE incident_ts
  DATAFILE '/opt/oracle/oradata/FREE/FREEPDB1/incident_ts01.dbf'
  SIZE 5M AUTOEXTEND OFF;

ALTER USER retail_app QUOTA UNLIMITED ON incident_ts;

PROMPT === Verify ===
SELECT tablespace_name, status FROM dba_tablespaces WHERE tablespace_name = 'INCIDENT_TS';
SELECT file_name, bytes/1024/1024 AS size_mb, autoextensible FROM dba_data_files WHERE tablespace_name = 'INCIDENT_TS';
