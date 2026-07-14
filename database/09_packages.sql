CREATE TABLE packages (
    package_id BIGSERIAL PRIMARY KEY,
    shipment_id BIGINT NOT NULL,
    package_code VARCHAR(30) UNIQUE NOT NULL,
    description VARCHAR(255),
    weight_kg DECIMAL(10,2) NOT NULL,
    length_cm DECIMAL(10,2),
    width_cm DECIMAL(10,2),
    height_cm DECIMAL(10,2),
    package_type VARCHAR(30) DEFAULT 'STANDARD' CHECK (package_type IN ('STANDARD','FRAGILE','PERISHABLE','DOCUMENT','HAZARDOUS')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_package_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(shipment_id) ON DELETE CASCADE
);

CREATE INDEX idx_packages_shipment_id ON packages(shipment_id);

CREATE TRIGGER trg_packages_updated_at
BEFORE UPDATE ON packages
FOR EACH ROW EXECUTE FUNCTION set_updated_at();