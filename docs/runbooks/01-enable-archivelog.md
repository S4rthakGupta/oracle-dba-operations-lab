# Runbook: enable ARCHIVELOG mode

**Why:** without it Oracle overwrites redo logs, so you can only restore to the last cold backup. ARCHIVELOG allows hot backups and point-in-time recovery.
**Impact:** needs a short outage (mount state). Do it in a window.

1. Check: `ARCHIVE LOG LIST;` (mode should read No Archive Mode).
2. Set FRA: `ALTER SYSTEM SET db_recovery_file_dest_size=10G;` then `ALTER SYSTEM SET db_recovery_file_dest='/opt/oracle/oradata/recovery_area';`
3. `SHUTDOWN IMMEDIATE;` `STARTUP MOUNT;` `ALTER DATABASE ARCHIVELOG;` `ALTER DATABASE OPEN;`
4. Verify: `ARCHIVE LOG LIST;` shows Archive Mode. `ALTER SYSTEM SWITCH LOGFILE;` and confirm an archived log appears.
5. `ALTER PLUGGABLE DATABASE FREEPDB1 SAVE STATE;` so the PDB reopens automatically.
6. Take a full backup immediately (runbook 02).

**Rollback:** same steps with `NOARCHIVELOG`.
**Watch:** FRA usage; a full FRA stops the database from archiving and can hang it.
