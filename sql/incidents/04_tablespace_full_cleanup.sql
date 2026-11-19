-- 04_tablespace_full_cleanup.sql
-- Purpose : Remove everything the tablespace-full exercise created.
-- Run as  : SYSDBA. Usage:
--           docker exec -i oracle-practice sqlplus -s / as sysdba < sql/incidents/04_tablespace_full_cleanup.sql
-- Warning : DROP ... INCLUDING CONTENTS AND DATAFILES is permanent. It only touches incident_ts and incident_fill.

ALTER SESSION SET CONTAINER = FREEPDB1;
DROP TABLE retail_app.incident_fill PURGE;
DROP TABLESPACE incident_ts INCLUDING CONTENTS AND DATAFILES;
