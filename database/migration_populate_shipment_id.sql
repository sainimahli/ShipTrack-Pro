-- Migration: Populate shipment_id in tracking_events from shipments.tracking_number
-- Run this AFTER tracking_events.shipment_id column exists but is NULL

UPDATE tracking_events te
SET shipment_id = s.id
FROM shipments s
WHERE te.tracking_number = s.tracking_number
  AND te.shipment_id IS NULL;

-- Verify migration
SELECT COUNT(*) as events_with_shipment_id FROM tracking_events WHERE shipment_id IS NOT NULL;
SELECT COUNT(*) as events_missing_shipment_id FROM tracking_events WHERE shipment_id IS NULL;
