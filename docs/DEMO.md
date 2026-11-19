# Demo cue sheet

Interview slot: 30 minutes, three interviewers, Teams, camera on. **Default plan: 3-minute walkthrough, only if offered or asked.** The 7-minute route is for if they want more.

## Opening line (honest)
"I built a small Oracle lab in Docker with a fictional retail database, to practice administration, security, backup and recovery, and monitoring. It's a lab on a single instance, not production. I can show a quick walkthrough if that's useful."

## Pre-flight checklist (Friday, start 11:30, done by 12:30)
1. Open Docker Desktop, wait for it to be ready (`docker info | head -3`).
2. `docker start oracle-practice`, then `docker logs --tail 5 oracle-practice` until `DATABASE IS READY TO USE!`.
3. PDB open: `printf 'SELECT name, open_mode FROM v$pdbs;\n' | docker exec -i oracle-practice sqlplus -s / as sysdba` (FREEPDB1 = READ WRITE).
4. Dashboard: `cd ~/oracle-dba-operations-lab/dashboard && npm run dev`, open http://localhost:3000, health cards green.
5. Browser tabs ready: dashboard, the GitHub repo, `evidence/screenshots`.
6. Two Terminal tabs open in `~/oracle-dba-operations-lab`, font large.
7. Close notification apps. Hide the `.env.local` file and any password screenshots (`private/` is local only).
8. Test screen sharing in Teams a few minutes before.

## 3-minute route
| Time | Show | Say |
|---|---|---|
| 0:00 | Dashboard | "This is the live state of the database: instance health, sessions, tablespaces, archive mode and recent backups. It connects with a low-privilege monitor account, not SYSDBA." |
| 0:40 | Terminal: instance vs database | "The instance is memory and processes, the database is the files on disk." |
| 1:10 | Terminal: ARCHIVE LOG LIST, LIST BACKUP SUMMARY | "ARCHIVELOG is on, and I have validated full backups." |
| 1:50 | Evidence screenshots 18b to 19b | "I simulated losing the datafile, restored and recovered it with RMAN, and a row added after the backup survived." |
| 2:40 | Repo | "Everything is in GitHub with runbooks and a command guide." |

## Commands for the terminal part
```
printf 'SELECT instance_name, status FROM v$instance;\n' | docker exec -i oracle-practice sqlplus -s / as sysdba
printf 'SELECT name, open_mode, log_mode FROM v$database;\n' | docker exec -i oracle-practice sqlplus -s / as sysdba
printf 'ARCHIVE LOG LIST\n' | docker exec -i oracle-practice sqlplus -s / as sysdba
docker exec -i oracle-practice rman target / <<'EOF'
LIST BACKUP SUMMARY;
EOF
```
The first reads memory (instance), the second reads the control file (database).

## 7-minute route (only if they ask for more)
Add, in this order: security test (`retail_report` cannot INSERT, ORA-41900, screenshots 14a to 14c), then the blocking-session incident if you have run it and have the evidence, then the recovery drill.

## Recovery drill: screenshots or live?
- **Default: screenshots** (`18a` to `19e` in `evidence/screenshots`). Nothing can go wrong.
- **Live only if you rehearsed it twice** in the last day and it worked both times. Sequence: take `RETAIL_DATA` offline as in `18a`/`18b`, show the dashboard fail, then run the RESTORE and RECOVER from `19a`/`19b` and bring it online. Follow your own screenshots for the exact commands.

## If something breaks mid-demo
Say: "That's the risk of a live demo. I have the recorded evidence, so let me show that." Open the screenshots, keep talking. Do not debug for more than 30 seconds in front of them.

## One-liners per stage
- **Architecture:** "Instance is memory and processes, database is files. Startup goes NOMOUNT, MOUNT, OPEN."
- **Security:** "Least privilege with roles. A read-only account fails an INSERT."
- **Backup:** "ARCHIVELOG plus RMAN full backups with a 7-day recovery window, and I validated them."
- **Recovery:** "Restore copies the old file back, recover applies redo to catch up. No committed data lost."
- **Monitoring:** "A dashboard on a separate low-privilege account."

## Limits to state if asked
Single instance on a laptop. RAC, ASM, Data Guard, GoldenGate and Exadata are study notes only (`docs/ENTERPRISE_STUDY_NOTES.md`). I have not done point-in-time recovery or run DBCA myself.

## Questions to ask them at the end
- What does the Oracle team's typical day look like, and which environments does a new person get access to first?
- How are backups and changes managed (tools, approvals)?
- What would success look like in the first three months?
