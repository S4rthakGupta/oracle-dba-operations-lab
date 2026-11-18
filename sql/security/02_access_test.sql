-- 02_access_test.sql
-- Purpose : Prove least privilege. Run it as DIFFERENT users and compare the results.
-- Run as  : RETAIL_REPORT (read-only) and again as RETAIL_MONITOR (health views only).
-- Usage   : read -s "PW?password: "; echo
--           docker exec -i oracle-practice sqlplus -s "retail_report/${PW}@localhost:1521/FREEPDB1" < sql/security/02_access_test.sql
--           (repeat with retail_monitor and its password)
--           unset PW
-- Expect  : retail_report  -> SELECT works; INSERT and DELETE fail with ORA-41900 (missing privilege on the table, Oracle 23ai/26ai wording); CREATE TABLE fails with ORA-01031.
--           retail_monitor -> everything on retail_app tables fails with ORA-00942 (cannot even see them).
-- Safe    : Every write below is expected to be refused. Nothing changes if the security is correct.

SET LINESIZE 150
SHOW USER

PROMPT === 1. Can I READ orders? (reporting user: yes) ===
SELECT COUNT(*) AS order_count FROM retail_app.orders;

PROMPT === 2. Can I INSERT a customer? (expect ORA-41900 missing INSERT privilege for the report user) ===
INSERT INTO retail_app.customers (full_name, email) VALUES ('Should Fail', 'fail@example.com');

PROMPT === 3. Can I DELETE orders? (expect ORA-41900 for the report user) ===
DELETE FROM retail_app.orders;

PROMPT === 4. Can I CREATE a table? (expect ORA-01031) ===
CREATE TABLE should_fail (id NUMBER);

PROMPT === 5. Which roles do I have? ===
SELECT role FROM session_roles ORDER BY role;

ROLLBACK;
