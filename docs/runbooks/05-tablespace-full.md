# Runbook: tablespace full (ORA-01653)

**Status:** procedure and scripts written. Evidence is added to the README once the exercise has been run in this lab.

## What it is
A table or index cannot get a new extent because its tablespace has no free space and cannot grow. Related errors: ORA-01654 (index), ORA-01652 (TEMP), ORA-01650 (undo).

## Symptoms
`ORA-01653: unable to extend table <owner>.<table> by 8 in tablespace <name>`. Inserts and updates fail. Reads still work.

## Diagnose
```sql
SELECT df.tablespace_name,
       ROUND(df.bytes/1024/1024)              AS size_mb,
       ROUND(NVL(fs.bytes,0)/1024/1024)       AS free_mb
  FROM (SELECT tablespace_name, SUM(bytes) bytes FROM dba_data_files GROUP BY tablespace_name) df
  LEFT JOIN (SELECT tablespace_name, SUM(bytes) bytes FROM dba_free_space GROUP BY tablespace_name) fs
    ON fs.tablespace_name = df.tablespace_name;

SELECT file_name, bytes/1024/1024 AS size_mb, autoextensible, maxbytes/1024/1024 AS max_mb
  FROM dba_data_files WHERE tablespace_name = 'INCIDENT_TS';
```
Also check disk space on the server before adding space.

## Fix options (pick one)
1. **Resize the datafile:** `ALTER DATABASE DATAFILE '<path>' RESIZE 50M;`
2. **Add a datafile:** `ALTER TABLESPACE incident_ts ADD DATAFILE '<path>' SIZE 50M;`
3. **Allow growth, with a cap:** `ALTER DATABASE DATAFILE '<path>' AUTOEXTEND ON NEXT 10M MAXSIZE 200M;`
4. **Free space:** purge or archive old data, then shrink or move segments (only if the data can really go).

Verify with the diagnose query, then retry the failed statement.

## Prevent
- Monitor tablespace usage and alert before it fills (for example at 80% and 90%).
- Use AUTOEXTEND with a sensible MAXSIZE, so one application cannot fill the disk.
- Capacity planning: track growth per tablespace over time.

## Lab exercise
`sql/incidents/02` setup, `03` fill (expect ORA-01653), fix with option 1, then `04` cleanup. The exercise uses a throwaway tablespace `incident_ts`, never `RETAIL_DATA`.
