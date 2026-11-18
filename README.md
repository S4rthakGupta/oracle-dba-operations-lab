# Oracle DBA Operations Lab

A hands-on Oracle Database administration lab modeled on a small clothing and
merchandise business (similar to Sudomade). **All data is fictional.** This is a
learning lab, not a production system.

**Environment:** Oracle AI Database 26ai Free (23.26.3) running in Docker on a
MacBook Pro M4 Pro. Instance `FREE`, pluggable database `FREEPDB1`.

## Status
- [x] Stage 1: Architecture and health checks
- [x] Stage 2: Retail schema, least-privilege security, live dashboard
- [x] Stage 3: ARCHIVELOG, RMAN backup, validation, datafile loss drill and recovery
- [ ] Stage 4: Incidents (blocking sessions, tablespace full)
- [ ] Stage 5: Enterprise concepts (RAC, ASM, Data Guard, GoldenGate, Exadata): study notes only

Only items checked above have been done and verified in this lab.

## Where to look
| What | Where |
|---|---|
| Every command explained, grouped by where it runs | [`docs/COMMANDS.md`](docs/COMMANDS.md) |
| Runbooks | [`docs/runbooks/`](docs/runbooks/) (ARCHIVELOG, full backup, datafile recovery) |
| SQL scripts | [`sql/`](sql/) (monitoring, schema, security) |
| Live dashboard (Next.js) | [`dashboard/`](dashboard/) |
| Screenshot evidence | [`evidence/screenshots/`](evidence/screenshots/) |

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
| Archive mode | `NOARCHIVELOG` (changed in Stage 3) | [07](evidence/screenshots/07-log-mode-noarchivelog.png) |
| Full health check script | control files, redo logs, datafiles listed | [08a](evidence/screenshots/08a-health-check-script-output.png), [08b](evidence/screenshots/08b-health-check-script-output.png) |

### Key concepts
- **Instance** = memory (SGA) + background processes. **Database** = files on disk
  (datafiles, control files, redo logs).
- On commit, **LGWR** writes the redo log. **DBWn** writes data blocks later.
- 2 control file copies and 2 redo log files, all in one folder (fine for a lab;
  production would spread copies across disks).

## Stage 2: Retail schema, security and dashboard

Scripts: [`sql/schema/`](sql/schema/) (run in order, `03_create_tables.sql` once only) and
[`sql/security/`](sql/security/).

- Created the `RETAIL_DATA` tablespace and the `retail_app` schema owner in `FREEPDB1`
  ([09](evidence/screenshots/09-switch-to-freepdb1.png),
  [11](evidence/screenshots/11-retail-data-tablespace.png),
  [12](evidence/screenshots/12-retail-app-user.png)).
- Created the retail tables: customers, products, orders, order items, payments
  ([12b](evidence/screenshots/12b-retail-tables-created.png)).
- **Least privilege:** `retail_report` has a read-only role, and `retail_monitor` can
  only read monitoring views. An INSERT by `retail_report` fails with ORA-41900
  ([14a](evidence/screenshots/14a-readonly-role-and-user.png),
  [14b](evidence/screenshots/14b-readonly-access-test.png),
  [14c](evidence/screenshots/14c-monitor-access-test.png)).
- **Dashboard:** Next.js + TypeScript + node-oracledb. Instance health, sessions,
  tablespace usage, archive mode, recent backups and retail KPIs, using the monitor and
  app accounts rather than SYSDBA
  ([13a](evidence/screenshots/13a-dashboard-top.png),
  [13b](evidence/screenshots/13b-dashboard-middle.png),
  [13c](evidence/screenshots/13c-dashboard-bottom.png)). Setup is in
  [`dashboard/README.md`](dashboard/README.md). Credentials live in git-ignored `.env.local`.

## Stage 3: Backup and recovery

Runbooks: [ARCHIVELOG](docs/runbooks/01-enable-archivelog.md),
[full backup](docs/runbooks/02-rman-full-backup.md),
[datafile recovery](docs/runbooks/03-datafile-loss-recovery.md).

| Step | Result | Evidence |
|---|---|---|
| Fast Recovery Area configured | 10G, `/opt/oracle/oradata/recovery_area` | [15a](evidence/screenshots/15a-recovery-area-setup.png) |
| ARCHIVELOG enabled | via MOUNT, then OPEN | [15b](evidence/screenshots/15b-archivelog-enabled.png), [15b2](evidence/screenshots/15b2-archivelog-enable-output.png), [15c](evidence/screenshots/15c-dashboard-archivelog.png) |
| RMAN full backup | `BACKUP DATABASE PLUS ARCHIVELOG`, recovery window 7 days, controlfile autobackup | [16c](evidence/screenshots/16c-rman-list-backup.png), [16d](evidence/screenshots/16d-dashboard-backups.png) |
| Backup validation | no errors | [17a](evidence/screenshots/17a-rman-validate.png), [17b](evidence/screenshots/17b-rman-validate.png) |
| **Drill:** datafile lost | ORA-00376 / ORA-01110, dashboard red | [18a](evidence/screenshots/18a-drill-prepare.png), [18b](evidence/screenshots/18b-datafile-lost.png), [18c](evidence/screenshots/18c-dashboard-failure.png) |
| `RESTORE` + `RECOVER DATAFILE` | recovered, no data loss (a row added after the backup survived) | [19a](evidence/screenshots/19a-rman-restore-start.png), [19b](evidence/screenshots/19b-rman-restore-recover-verified.png), [19c](evidence/screenshots/19c-dashboard-recovered-top.png), [19d](evidence/screenshots/19d-dashboard-recovered-bottom.png) |
| Fresh backup after recovery | taken | [19e](evidence/screenshots/19e-post-recovery-backup.png) |

Note: `v$rman_backup_job_details` is empty when connected to the PDB, so the dashboard
reads `v$backup_set`, which is visible from `FREEPDB1`.

## Limits of this lab
Single instance on a laptop. Not covered hands-on: RAC, ASM, Data Guard, GoldenGate,
Exadata, point-in-time recovery, loss of all control files. Those will be study notes
in Stage 5 and are labeled that way.
