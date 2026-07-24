CREATE TABLE shipments (
    shipment_id BIGSERIAL PRIMARY KEY,
    tracking_number VARCHAR(30) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL,
    sender_address_id BIGINT NOT NULL,
    receiver_address_id BIGINT NOT NULL,
    origin_warehouse_id BIGINT,
    destination_warehouse_id BIGINT,
    assigned_driver_id BIGINT,
    assigned_vehicle_id BIGINT,
    shipment_status VARCHAR(30) NOT NULL DEFAULT 'CREATED'
        CHECK (shipment_status IN ('CREATED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED_DELIVERY','CANCELLED')),
    total_weight_kg DECIMAL(10,2),
    expected_delivery_date DATE,
    actual_delivery_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_shipment_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_shipment_sender_address FOREIGN KEY (sender_address_id) REFERENCES addresses(address_id),
    CONSTRAINT fk_shipment_receiver_address FOREIGN KEY (receiver_address_id) REFERENCES addresses(address_id),
    CONSTRAINT fk_shipment_origin_warehouse FOREIGN KEY (origin_warehouse_id) REFERENCES warehouses(warehouse_id),
    CONSTRAINT fk_shipment_destination_warehouse FOREIGN KEY (destination_warehouse_id) REFERENCES warehouses(warehouse_id),
    CONSTRAINT fk_shipment_driver FOREIGN KEY (assigned_driver_id) REFERENCES drivers(driver_id),
    CONSTRAINT fk_shipment_vehicle FOREIGN KEY (assigned_vehicle_id) REFERENCES vehicles(vehicle_id)
);

CREATE INDEX idx_shipments_user_id ON shipments(user_id);
CREATE INDEX idx_shipments_sender_address_id ON shipments(sender_address_id);
CREATE INDEX idx_shipments_receiver_address_id ON shipments(receiver_address_id);
CREATE INDEX idx_shipments_origin_warehouse_id ON shipments(origin_warehouse_id);
CREATE INDEX idx_shipments_destination_warehouse_id ON shipments(destination_warehouse_id);
CREATE INDEX idx_shipments_driver_id ON shipments(assigned_driver_id);
CREATE INDEX idx_shipments_vehicle_id ON shipments(assigned_vehicle_id);
CREATE INDEX idx_shipments_status ON shipments(shipment_status);

CREATE TRIGGER trg_shipments_updated_at
BEFORE UPDATE ON shipments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();