INSERT INTO shipments (
    tracking_number, user_id, sender_address_id, receiver_address_id,
    origin_warehouse_id, destination_warehouse_id, assigned_driver_id, assigned_vehicle_id,
    shipment_status, total_weight_kg, expected_delivery_date
) VALUES
('STP-2026-000001', 1, 2, 3, 1, NULL, 1, 1, 'IN_TRANSIT', 12.5, '2026-07-10');