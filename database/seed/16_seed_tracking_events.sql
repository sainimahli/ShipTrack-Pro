-- Tracking events used by the live shipment-management and tracking APIs.
INSERT INTO tracking_events (
    shipment_id, tracking_number, shipment_status, location_name, description, updated_by, updated_at
) VALUES
    (1, 'STP-2026-000001', 'CREATED', 'Lucknow Central Hub', 'Shipment created', 'SYSTEM', '2026-07-06 09:00:00+05:30'),
    (1, 'STP-2026-000001', 'PICKED_UP', 'Lucknow Central Hub', 'Package picked up', 'operator@shiptrackpro.com', '2026-07-06 11:30:00+05:30'),
    (1, 'STP-2026-000001', 'IN_TRANSIT', 'En route to Kanpur', 'Shipment is in transit', 'operator@shiptrackpro.com', '2026-07-06 14:00:00+05:30');
