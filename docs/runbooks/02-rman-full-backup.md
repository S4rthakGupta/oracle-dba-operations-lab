# Runbook: RMAN full backup and validation

1. Prereq: ARCHIVELOG on, FRA has space (`v$recovery_file_dest`).
2. `docker exec -i oracle-practice rman target / <<'EOF2'` then `BACKUP DATABASE PLUS ARCHIVELOG;` then `EOF2`
3. Confirm: `LIST BACKUP SUMMARY;`, dashboard "Recent RMAN backups" card.
4. Validate: `RESTORE DATABASE VALIDATE;` (no errors expected).
5. Housekeeping: `REPORT OBSOLETE;` then `DELETE OBSOLETE;` only after reviewing the report.

**Policy:** recovery window 7 days, control file autobackup ON.
**A backup you have not validated or restored is a hope, not a backup.**
