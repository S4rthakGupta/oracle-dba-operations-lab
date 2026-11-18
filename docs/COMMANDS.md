# Commands explained

Every command used in this lab, grouped by **where it runs**. If you only remember one thing: there are four places a command can run, and the same Oracle database is reached through different doors.

| Where | Prompt looks like | What it is |
|---|---|---|
| Mac terminal | `%` | Your normal shell. Used for docker, git, npm. |
| `docker exec` | `%` (one-shot) | Runs one command inside the Oracle container, then returns to the Mac. |
| SQL*Plus | `SQL>` | Oracle's SQL client, runs inside the container. Used for SQL and admin statements. |
| RMAN | `RMAN>` | Oracle's backup/recovery client, runs inside the container. |

## 1. Mac terminal

| Command | What it does |
|---|---|
| `docker ps` | Lists running containers. Confirms `oracle-practice` is up. |
| `docker exec -it oracle-practice sqlplus / as sysdba` | `exec` = run inside the container. `-it` = interactive terminal. `sqlplus / as sysdba` = log in as SYSDBA using OS authentication (no password, because you are the oracle OS user inside the container). |
| `docker exec -i oracle-practice rman target / <<'EOF' ... EOF` | Starts RMAN connected to the local database (`target /`). The heredoc feeds it the commands. Quoting `'EOF'` stops the Mac shell from expanding `$` (so `v$views` survive). |
| `git add / status / commit / push` | Stage, check, record and publish changes. Always run `git status` before committing. |
| `npm run dev` | Starts the Next.js dashboard on localhost:3000. Restart it after editing `.env.local`. |

## 2. SQL*Plus (inside the container)

| Statement | What it does |
|---|---|
| `ALTER SESSION SET CONTAINER = FREEPDB1;` | Switches from the root container (CDB$ROOT) to the pluggable database where app data lives. |
| `SELECT instance_name, status FROM v$instance;` | Instance = memory + background processes. Shows it is OPEN. |
| `SELECT name, open_mode FROM v$pdbs;` | Lists pluggable databases and whether they are open. |
| `SELECT name FROM v$controlfile;` / `v$logfile` / `v$datafile` | The three physical file types: control files (database map), redo logs (change journal), datafiles (the data). |
| `CREATE TABLESPACE retail_data DATAFILE '...' SIZE 100M AUTOEXTEND ON;` | Creates logical storage backed by a datafile that can grow. |
| `CREATE USER ... DEFAULT TABLESPACE retail_data QUOTA ...;` | Creates the app owner and says where its objects live and how much it may use. |
| `GRANT CREATE SESSION ...` / `CREATE ROLE` | Least privilege: give only what each account needs. `retail_report` gets SELECT only, so INSERT fails with ORA-41900. |
| `ALTER USER x IDENTIFIED BY ...;` | Resets a password. `ACCOUNT UNLOCK` fixes ORA-28000. |
| `SHUTDOWN IMMEDIATE; STARTUP MOUNT; ALTER DATABASE ARCHIVELOG; ALTER DATABASE OPEN;` | The only way to switch to ARCHIVELOG: it needs the database MOUNTED, not open. |
| `ALTER SYSTEM SET db_recovery_file_dest_size=10G;` then `..._dest='...'` | Defines the Fast Recovery Area (where backups and archived logs go). Size first, then location. |
| `ALTER SYSTEM SWITCH LOGFILE;` | Forces a redo log switch so the old log is archived. Archiving is asynchronous, so wait a few seconds. |
| `ARCHIVE LOG LIST;` | Shows mode and current log sequence. |
| `ALTER TABLESPACE retail_data OFFLINE IMMEDIATE;` | Used in the drill to simulate losing a datafile (causes ORA-00376 / ORA-01110). |

## 3. RMAN

| Command | What it does |
|---|---|
| `CONFIGURE RETENTION POLICY TO RECOVERY WINDOW OF 7 DAYS;` | Keep enough backups to restore to any point in the last 7 days. |
| `CONFIGURE CONTROLFILE AUTOBACKUP ON;` | Back up the control file automatically after every backup. Needed to recover if the control file is lost. |
| `BACKUP DATABASE PLUS ARCHIVELOG;` | Full backup: archives current log, backs up datafiles, then logs. This is the standard full backup. |
| `LIST BACKUP SUMMARY;` | What backups exist. |
| `REPORT NEED BACKUP;` / `REPORT OBSOLETE;` | Which files lack a recent backup / which backups are no longer needed under the policy. |
| `RESTORE DATABASE VALIDATE;` / `BACKUP VALIDATE DATABASE;` | Reads backups/datafiles and checks them without changing anything. Proves backups are usable. |
| `RESTORE DATAFILE 25;` | Copies the datafile back from backup. |
| `RECOVER DATAFILE 25;` | Replays archived and online redo to bring it up to the present. Restore = old copy, recover = catch up. |
| `SQL 'ALTER DATABASE DATAFILE 25 ONLINE';` | Brings the repaired file back. |

## 4. Why the dashboard card reads `v$backup_set`

`v$rman_backup_job_details` only shows jobs from the root container, and the dashboard connects to FREEPDB1, so it was empty. `v$backup_set` and `v$backup_piece` are visible from the PDB. Good interview answer for "why did this view return nothing?"

## 5. Error cheat sheet

| Error | Meaning |
|---|---|
| ORA-01017 | Wrong username/password |
| ORA-28000 | Account locked |
| ORA-00942 | Table or view does not exist (or no privilege, pre-26ai) |
| ORA-41900 | Missing privilege on table (26ai wording) |
| ORA-01031 | Insufficient privileges for the operation |
| ORA-00955 / ORA-00001 | Name already used / unique constraint violated (the duplicate-run mistakes) |
| ORA-00376 + ORA-01110 | Datafile offline / which file |
| ORA-01653 | Cannot extend table: tablespace full |
