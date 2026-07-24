CREATE TABLE alerts (
    id BIGSERIAL PRIMARY KEY,
    shipment_id BIGINT NOT NULL,
    message VARCHAR(500) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_alert_shipment
        FOREIGN KEY (shipment_id) REFERENCES shipments(shipment_id) ON DELETE CASCADE
);

CREATE INDEX idx_alerts_shipment_created_at ON alerts(shipment_id, created_at DESC);
CREATE INDEX idx_alerts_shipment_unread ON alerts(shipment_id, is_read);
