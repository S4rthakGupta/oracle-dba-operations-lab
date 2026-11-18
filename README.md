# Oracle DBA Operations Lab

A hands-on Oracle Database administration lab modeled on a small clothing and
merchandise business (similar to Sudomade). **All data is fictional.** This is a
learning lab, not a production system.

**Environment:** Oracle AI Database 26ai Free (23.26.3) running in Docker on a
MacBook Pro M4 Pro. Instance `FREE`, pluggable database `FREEPDB1`.

## Status
- [x] Stage 1: Architecture and health checks
- [ ] Stage 2: Retail schema and security
- [ ] Stage 3: RMAN backup and recovery
- [ ] Stage 4: Incidents (blocking sessions, tablespace full)
- [ ] Stage 5: Enterprise concepts (RAC, ASM, Data Guard, GoldenGate, Exadata): study notes only

Only items checked above have been done and verified in this lab.

## Stage 1: Architecture and health checks

Script: [`sql/monitoring/01_health_check.sql`](sql/monitoring/01_health_check.sql) (read-only)

```bash
docker exec -i oracle-practice sqlplus -s / as sysdba < sql/monitoring/01_health_check.sql
```

### What I verified
| Check | Result | Evidence |
|---|---|---|
| Container running, port 1521 | Up | [01](evidence/screenshots/01-docker-ps.png) |
| Instance `FREE` status | `OPEN` | [02](evidence/screenshots/02-instance-open.png) |
| Database open mode / container | `READ WRITE`, `CDB$ROOT` | [03](evidence/screenshots/03-database-open-and-con-name.png) |
| Pluggable databases | `PDB$SEED`, `FREEPDB1` | [04](evidence/screenshots/04-pdbs-and-sga.png) |
| SGA | about 1.5 GB (buffer cache about 944 MB, redo buffer about 4 MB) | [05](evidence/screenshots/05-sga-memory.png) |
| Core background processes | PMON, SMON, DBW0, LGWR, CKPT, LREG, RECO running; no ARC0 | [06](evidence/screenshots/06-core-background-processes.png) |
| Archive mode | `NOARCHIVELOG` (to be changed in Stage 3) | [07](evidence/screenshots/07-log-mode-noarchivelog.png) |
| Full health check script | control files, redo logs, datafiles listed | [08a](evidence/screenshots/08a-health-check-script-output.png), [08b](evidence/screenshots/08b-health-check-script-output.png) |

### Key concepts
- **Instance** = memory (SGA) + background processes. **Database** = files on disk
  (datafiles, control files, redo logs).
- On commit, **LGWR** writes the redo log. **DBWn** writes data blocks later.
- 2 control file copies and 2 redo log files, all in one folder (fine for a lab;
  production would spread copies across disks).
- Database is in NOARCHIVELOG mode, so recovery is limited to the last backup.
