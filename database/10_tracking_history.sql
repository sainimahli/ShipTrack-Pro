CREATE TABLE tracking_history (
    tracking_event_id BIGSERIAL PRIMARY KEY,
    shipment_id BIGINT NOT NULL,
    event_status VARCHAR(30) NOT NULL
        CHECK (event_status IN ('CREATED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED_DELIVERY','CANCELLED')),
    location_description VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    remarks TEXT,
    updated_by_user_id BIGINT,
    event_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tracking_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(shipment_id) ON DELETE CASCADE,
    CONSTRAINT fk_tracking_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES users(user_id)
);

CREATE INDEX idx_tracking_shipment_id ON tracking_history(shipment_id);
CREATE INDEX idx_tracking_status ON tracking_history(event_status);
CREATE INDEX idx_tracking_event_time ON tracking_history(event_time);