-- 03_tablespace_full_fill.sql
-- Purpose : Fill the 5 MB tablespace until Oracle raises ORA-01653.
-- Run as  : retail_app (it will prompt for the password; do not put it in this file):
--           docker exec -it oracle-practice sqlplus retail_app@//localhost:1521/FREEPDB1
--           SQL> @/path/inside/container/03_tablespace_full_fill.sql   (or paste the statements)
-- Expect  : the INSERT fails with ORA-01653: unable to extend table RETAIL_APP.INCIDENT_FILL ... in tablespace INCIDENT_TS

CREATE TABLE incident_fill (id NUMBER, pad VARCHAR2(1000)) TABLESPACE incident_ts;

-- ~100 MB of rows into a 5 MB tablespace: this must fail.
INSERT INTO incident_fill SELECT level, RPAD('x', 1000, 'x') FROM dual CONNECT BY level <= 100000;

-- After the fix (see the runbook), a small insert should work:
-- INSERT INTO incident_fill SELECT level, RPAD('x', 1000, 'x') FROM dual CONNECT BY level <= 1000;
-- COMMIT;
