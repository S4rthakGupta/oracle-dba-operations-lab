/**
 * Every query the dashboard runs. All of them are SELECTs.
 * HEALTH and LIVE run as RETAIL_MONITOR (SELECT_CATALOG_ROLE). RETAIL runs as RETAIL_APP.
 * Each query is run on its own, so one failing view never blanks the whole page.
 */

export const HEALTH: Record<string, string> = {
  instance: `SELECT instance_name, status, version, host_name,
                    TO_CHAR(startup_time, 'YYYY-MM-DD HH24:MI') AS startup_time
               FROM v$instance`,
  database: `SELECT name, open_mode, log_mode FROM v$database`,
  container: `SELECT SYS_CONTEXT('USERENV','CON_NAME') AS con_name FROM dual`,
  sga: `SELECT name, ROUND(bytes/1024/1024, 1) AS mb
          FROM v$sgainfo
         WHERE name IN ('Maximum SGA Size','Fixed SGA Size','Buffer Cache Size','Shared Pool Size',
                        'Large Pool Size','Java Pool Size','Redo Buffers')
           AND bytes > 0`,
  tablespaces: `SELECT d.tablespace_name,
                       ROUND(d.mb) AS allocated_mb,
                       ROUND(d.mb - NVL(f.mb, 0)) AS used_mb
                  FROM (SELECT tablespace_name, SUM(bytes)/1024/1024 AS mb
                          FROM dba_data_files GROUP BY tablespace_name) d
                  LEFT JOIN (SELECT tablespace_name, SUM(bytes)/1024/1024 AS mb
                               FROM dba_free_space GROUP BY tablespace_name) f
                         ON f.tablespace_name = d.tablespace_name
                 ORDER BY d.tablespace_name`,
  backups: `SELECT status, input_type,
                   TO_CHAR(end_time, 'YYYY-MM-DD HH24:MI') AS end_time,
                   ROUND(output_bytes/1024/1024) AS output_mb
              FROM v$rman_backup_job_details
             ORDER BY end_time DESC
             FETCH FIRST 5 ROWS ONLY`,
};

export const LIVE: Record<string, string> = {
  stats: `SELECT name, value FROM v$sysstat
           WHERE name IN ('user commits','user calls','physical reads','session logical reads','redo size')`,
  sessions: `SELECT s.sid, s.serial# AS serial_no, s.username, s.status, s.program,
                    s.blocking_session, s.event, s.last_call_et
               FROM v$session s
              WHERE s.type = 'USER' AND s.username IS NOT NULL
              ORDER BY s.sid`,
};

export const RETAIL: Record<string, string> = {
  kpis: `SELECT NVL(SUM(CASE WHEN o.order_status IN ('PAID','SHIPPED') THEN o.total_amount END), 0) AS revenue,
                COUNT(*) AS orders,
                MAX(c.n) AS customers,
                MAX(p.n) AS low_stock
           FROM orders o
           CROSS JOIN (SELECT COUNT(*) AS n FROM customers) c
           CROSS JOIN (SELECT COUNT(*) AS n FROM products WHERE stock_quantity < 50) p`,
  byStatus: `SELECT order_status AS status, COUNT(*) AS cnt, SUM(total_amount) AS amount
               FROM orders GROUP BY order_status ORDER BY order_status`,
  counts: `SELECT 'CUSTOMERS' AS table_name, COUNT(*) AS row_count FROM customers
           UNION ALL SELECT 'PRODUCTS',    COUNT(*) FROM products
           UNION ALL SELECT 'ORDERS',      COUNT(*) FROM orders
           UNION ALL SELECT 'ORDER_ITEMS', COUNT(*) FROM order_items
           UNION ALL SELECT 'PAYMENTS',    COUNT(*) FROM payments`,
  orders: `SELECT o.order_id, c.full_name AS customer,
                  TO_CHAR(o.order_date, 'YYYY-MM-DD') AS order_date,
                  o.order_status, o.total_amount,
                  NVL(p.payment_status, 'NONE') AS payment_status
             FROM orders o
             JOIN customers c ON c.customer_id = o.customer_id
             LEFT JOIN payments p ON p.order_id = o.order_id
            ORDER BY o.order_id`,
  products: `SELECT product_name, sku, price, stock_quantity FROM products ORDER BY product_id`,
};
