-- Migration: add sender_name and receiver_name columns to the shipments table.
-- Run this ONCE against any existing database that was created before these
-- columns were added to the JPA entity.
--
-- If your database was created from the full schema (08_shipments.sql) after
-- this migration was applied, you do NOT need to run this script.
--
-- Safe to run on a database that already has receiver_name (it checks first).

DO $$
BEGIN
    -- receiver_name (was previously missing from some schema versions)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'shipments' AND column_name = 'receiver_name'
    ) THEN
        ALTER TABLE shipments ADD COLUMN receiver_name VARCHAR(100);
    END IF;

    -- sender_name (newly added to store the user-entered sender name explicitly)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'shipments' AND column_name = 'sender_name'
    ) THEN
        ALTER TABLE shipments ADD COLUMN sender_name VARCHAR(100);
    END IF;
END $$;
