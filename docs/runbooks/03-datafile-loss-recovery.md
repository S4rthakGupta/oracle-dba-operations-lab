# Runbook: datafile loss (RETAIL_DATA)

**Symptoms:** ORA-00376 / ORA-01110 naming the file, dashboard retail cards red.
**Prereq:** ARCHIVELOG + a good backup. Database stays open; only the tablespace is down.

1. Identify: `SELECT file#, name FROM v$datafile;` (retail_data01.dbf = file 25 in this lab).
2. `RESTORE DATAFILE 25;` (copy from backup)
3. `RECOVER DATAFILE 25;` (apply archived + online redo)
4. `SQL 'ALTER DATABASE DATAFILE 25 ONLINE';` (or `ALTER TABLESPACE retail_data ONLINE;`)
5. Verify: query the tables, confirm data written after the last backup is present, dashboard green.
6. Take a fresh backup.

**Result in the drill:** zero data loss, including a row inserted after the backup.
**Not covered here:** loss of all control files, loss of the whole database, point-in-time recovery.
