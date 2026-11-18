-- 03_create_tables.sql
-- Purpose : Create the retail application's tables and load FICTIONAL sample data.
-- Run as  : RETAIL_APP (the schema owner), connected to the FREEPDB1 service. Not SYSDBA.
-- Usage   : read -s "APP_PW?retail_app password: "; echo
--           docker exec -i oracle-practice sqlplus -s "retail_app/${APP_PW}@localhost:1521/FREEPDB1" < sql/schema/03_create_tables.sql
-- Note    : Written for a fresh schema. Re-running fails with ORA-00955 (name already used), which is expected.
-- Design  : Primary keys, foreign keys, NOT NULL and CHECK constraints so bad data is rejected by the database itself.
--           Foreign key columns are indexed. No real customer or payment data is used anywhere.

SET LINESIZE 150
COLUMN table_name FORMAT A20
COLUMN tablespace_name FORMAT A20

CREATE TABLE customers (
  customer_id       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name         VARCHAR2(100) NOT NULL,
  email             VARCHAR2(150) NOT NULL,
  registration_date DATE DEFAULT SYSDATE NOT NULL,
  CONSTRAINT uq_customers_email UNIQUE (email)
);

CREATE TABLE products (
  product_id     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_name   VARCHAR2(100) NOT NULL,
  sku            VARCHAR2(30)  NOT NULL,
  price          NUMBER(10,2)  NOT NULL,
  stock_quantity NUMBER(8) DEFAULT 0 NOT NULL,
  CONSTRAINT uq_products_sku UNIQUE (sku),
  CONSTRAINT ck_products_price CHECK (price >= 0),
  CONSTRAINT ck_products_stock CHECK (stock_quantity >= 0)
);

CREATE TABLE orders (
  order_id     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id  NUMBER NOT NULL,
  order_date   DATE DEFAULT SYSDATE NOT NULL,
  order_status VARCHAR2(20) DEFAULT 'NEW' NOT NULL,
  total_amount NUMBER(12,2) DEFAULT 0 NOT NULL,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
  CONSTRAINT ck_orders_status CHECK (order_status IN ('NEW','PAID','SHIPPED','CANCELLED'))
);

CREATE TABLE order_items (
  order_item_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id      NUMBER NOT NULL,
  product_id    NUMBER NOT NULL,
  quantity      NUMBER(6) NOT NULL,
  unit_price    NUMBER(10,2) NOT NULL,
  CONSTRAINT fk_items_order   FOREIGN KEY (order_id)   REFERENCES orders (order_id),
  CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products (product_id),
  CONSTRAINT ck_items_qty CHECK (quantity > 0)
);

CREATE TABLE payments (
  payment_id     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id       NUMBER NOT NULL,
  payment_status VARCHAR2(20) DEFAULT 'PENDING' NOT NULL,
  amount         NUMBER(12,2) NOT NULL,
  payment_date   DATE,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders (order_id),
  CONSTRAINT ck_payments_status CHECK (payment_status IN ('PENDING','PAID','FAILED','REFUNDED'))
);

-- Index the foreign key columns (joins and deletes on parent rows stay fast).
CREATE INDEX ix_orders_customer  ON orders (customer_id);
CREATE INDEX ix_items_order      ON order_items (order_id);
CREATE INDEX ix_items_product    ON order_items (product_id);
CREATE INDEX ix_payments_order   ON payments (order_id);

-- Fictional sample data.
INSERT INTO customers (full_name, email) VALUES ('Test Customer One',   'customer1@example.com');
INSERT INTO customers (full_name, email) VALUES ('Test Customer Two',   'customer2@example.com');
INSERT INTO customers (full_name, email) VALUES ('Test Customer Three', 'customer3@example.com');
INSERT INTO customers (full_name, email) VALUES ('Test Customer Four',  'customer4@example.com');
INSERT INTO customers (full_name, email) VALUES ('Test Customer Five',  'customer5@example.com');

INSERT INTO products (product_name, sku, price, stock_quantity) VALUES ('Classic Tee',          'TEE-BLK-M',  24.99, 120);
INSERT INTO products (product_name, sku, price, stock_quantity) VALUES ('Pullover Hoodie',      'HOOD-GRY-L', 54.99,  60);
INSERT INTO products (product_name, sku, price, stock_quantity) VALUES ('Crewneck Sweatshirt',  'CREW-NVY-M', 44.99,  45);
INSERT INTO products (product_name, sku, price, stock_quantity) VALUES ('Baseball Cap',         'CAP-BLK-OS', 19.99, 200);
INSERT INTO products (product_name, sku, price, stock_quantity) VALUES ('Custom Mug',           'MUG-WHT-11', 14.99, 150);

INSERT INTO orders (customer_id, order_status, total_amount) VALUES (1, 'SHIPPED',  69.97);
INSERT INTO orders (customer_id, order_status, total_amount) VALUES (2, 'PAID',     54.99);
INSERT INTO orders (customer_id, order_status, total_amount) VALUES (3, 'NEW',     104.97);

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (1, 1, 2, 24.99);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (1, 4, 1, 19.99);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (2, 2, 1, 54.99);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (3, 3, 2, 44.99);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (3, 5, 1, 14.99);

INSERT INTO payments (order_id, payment_status, amount, payment_date) VALUES (1, 'PAID',    69.97, SYSDATE);
INSERT INTO payments (order_id, payment_status, amount, payment_date) VALUES (2, 'PAID',    54.99, SYSDATE);
INSERT INTO payments (order_id, payment_status, amount, payment_date) VALUES (3, 'PENDING', 104.97, NULL);

COMMIT;

PROMPT === Verify: tables and where they are stored ===
SELECT table_name, tablespace_name FROM user_tables ORDER BY table_name;

PROMPT === Verify: row counts ===
SELECT 'CUSTOMERS' AS tbl, COUNT(*) AS rows_ FROM customers
UNION ALL SELECT 'PRODUCTS',    COUNT(*) FROM products
UNION ALL SELECT 'ORDERS',      COUNT(*) FROM orders
UNION ALL SELECT 'ORDER_ITEMS', COUNT(*) FROM order_items
UNION ALL SELECT 'PAYMENTS',    COUNT(*) FROM payments;
