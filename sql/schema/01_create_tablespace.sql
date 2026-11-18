-- 01_create_tablespace.sql
-- Purpose : Create a dedicated tablespace for the retail application.
-- Run as  : SYSDBA. The script switches into the pluggable database FREEPDB1.
-- Usage   : docker exec -i oracle-practice sqlplus -s / as sysdba < sql/schema/01_create_tablespace.sql
-- Why     : Gives the app its own storage so its size can be monitored, limited and recovered separately.
-- Note    : Starts at 200 MB, grows 50 MB at a time, capped at 1 GB so one app cannot fill the disk.

SET LINESIZE 150
COLUMN file_name FORMAT A60

ALTER SESSION SET CONTAINER = FREEPDB1;
SHOW CON_NAME

CREATE TABLESPACE retail_data
  DATAFILE '/opt/oracle/oradata/FREE/FREEPDB1/retail_data01.dbf'
  SIZE 200M
  AUTOEXTEND ON NEXT 50M MAXSIZE 1G;

PROMPT === Verify: tablespace exists ===
SELECT tablespace_name, status, contents FROM dba_tablespaces WHERE tablespace_name = 'RETAIL_DATA';

PROMPT === Verify: its datafile ===
SELECT file_name, bytes/1024/1024 AS size_mb, autoextensible, maxbytes/1024/1024 AS max_mb
FROM dba_data_files WHERE tablespace_name = 'RETAIL_DATA';
