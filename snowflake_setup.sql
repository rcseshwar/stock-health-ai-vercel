-- ==============================================================================
-- Stock Health AI - Snowflake Setup Script
-- ==============================================================================

-- 1. Database & Schema Setup
CREATE DATABASE IF NOT EXISTS STOCK_HEALTH_DB;
USE DATABASE STOCK_HEALTH_DB;
CREATE SCHEMA IF NOT EXISTS CORE;
USE SCHEMA CORE;

-- 2. Master Data Tables

-- Locations (Warehouses, Hospitals, Clinics)
CREATE OR REPLACE TABLE LOCATIONS (
    LOCATION_ID VARCHAR(50) PRIMARY KEY,
    LOCATION_NAME VARCHAR(255),
    REGION VARCHAR(100),
    TYPE VARCHAR(50) -- 'WAREHOUSE', 'HOSPITAL', 'CLINIC'
);

-- Items (Medicines, Food, Essentials)
CREATE OR REPLACE TABLE ITEMS (
    ITEM_ID VARCHAR(50) PRIMARY KEY,
    ITEM_NAME VARCHAR(255),
    CATEGORY VARCHAR(100),
    UNIT_COST FLOAT,
    LEAD_TIME_DAYS INT, -- Expected days to restock
    MIN_ORDER_QTY INT
);

-- 3. Transactional Data (The "Single Source of Truth")

-- Daily Stock Register
CREATE OR REPLACE TABLE INVENTORY_LOGS (
    LOG_DATE DATE,
    LOCATION_ID VARCHAR(50),
    ITEM_ID VARCHAR(50),
    OPENING_STOCK INT,
    RECEIVED_QTY INT,
    ISSUED_QTY INT,
    CLOSING_STOCK INT, -- Calculated or verified count
    LAST_UPDATED TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    FOREIGN KEY (LOCATION_ID) REFERENCES LOCATIONS(LOCATION_ID),
    FOREIGN KEY (ITEM_ID) REFERENCES ITEMS(ITEM_ID)
);

-- 4. Dynamic Tables for Near Real-Time Aggregation
--    (Replacements for complex views, auto-refresh functionality)

CREATE OR REPLACE DYNAMIC TABLE CURRENT_STOCK_SNAPSHOT
    TARGET_LAG = '10 minutes'
    WAREHOUSE = COMPUTE_WH
AS
SELECT 
    L.LOCATION_NAME,
    I.ITEM_NAME,
    I.CATEGORY,
    INV.LOG_DATE,
    INV.CLOSING_STOCK,
    I.LEAD_TIME_DAYS,
    -- Simple heuristic for "Days Remaining" based on recent avg usage (placeholder logic)
    CASE 
        WHEN AVG(INV.ISSUED_QTY) OVER (PARTITION BY INV.LOCATION_ID, INV.ITEM_ID ORDER BY INV.LOG_DATE ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) = 0 THEN 999
        ELSE INV.CLOSING_STOCK / NULLIF(AVG(INV.ISSUED_QTY) OVER (PARTITION BY INV.LOCATION_ID, INV.ITEM_ID ORDER BY INV.LOG_DATE ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 0)
    END AS ESTIMATED_DAYS_LEFT
FROM INVENTORY_LOGS INV
JOIN LOCATIONS L ON INV.LOCATION_ID = L.LOCATION_ID
JOIN ITEMS I ON INV.ITEM_ID = I.ITEM_ID
WHERE INV.LOG_DATE = CURRENT_DATE();

-- 5. Tasks for Alerts/Scheduling (Optional Automation)

CREATE OR REPLACE TASK ALERT_LOW_STOCK_TASK
    WAREHOUSE = COMPUTE_WH
    SCHEDULE = 'USING CRON 0 8 * * * UTC' -- Run daily at 8am
AS
INSERT INTO ALERTS_LOG (ALERT_DATE, MESSAGE, SEVERITY)
SELECT 
    CURRENT_DATE(),
    'Low stock warning for ' || ITEM_NAME || ' at ' || LOCATION_NAME,
    'HIGH'
FROM CURRENT_STOCK_SNAPSHOT
WHERE ESTIMATED_DAYS_LEFT < LEAD_TIME_DAYS;

-- 6. Streamlit Integration Notes
-- The React frontend in this project replaces the native Streamlit UI, 
-- but you can connect this Snowflake data via REST API or Snowflake Node.js driver.
