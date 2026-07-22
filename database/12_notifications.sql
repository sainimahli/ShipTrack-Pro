CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    shipment_id BIGINT,
    event_type VARCHAR(30)
        CHECK (event_type IN (
            'SHIPMENT_CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY',
            'DELIVERED', 'FAILED_DELIVERY', 'DELAYED', 'ETA_UPDATED',
            'PAYMENT_SUCCESS', 'PAYMENT_FAILED'
        )),
    notification_type VARCHAR(30) NOT NULL 
        CHECK (notification_type IN ('EMAIL', 'SMS', 'PUSH')),
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_status VARCHAR(20) DEFAULT 'PENDING' 
        CHECK (sent_status IN ('PENDING', 'SENT', 'FAILED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_shipment 
        FOREIGN KEY (shipment_id) REFERENCES shipments(shipment_id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_shipment_id ON notifications(shipment_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_event_type ON notifications(event_type);