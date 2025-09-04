-- Initialize Nomedia Production Database
-- This script runs when the PostgreSQL container starts for the first time

-- Create database (already created by POSTGRES_DB env var)
-- \c nomedia_production;

-- Enable UUID extension (useful for future features)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance (these will be created by the app, but good to have)
-- The application will handle table creation and demo data

-- Set timezone
SET timezone = 'UTC';

-- Log initialization
SELECT 'Nomedia Production PostgreSQL database initialized' AS message;
