CREATE TABLE vehicles (
    vehicle_id BIGSERIAL PRIMARY KEY,
    warehouse_id BIGINT NOT NULL,
    vehicle_number VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type VARCHAR(30) NOT NULL CHECK (vehicle_type IN ('TRUCK','VAN','BIKE','TEMPO')),
    brand VARCHAR(50),
    model VARCHAR(50),
    manufacturing_year INTEGER,
    capacity_kg DECIMAL(10,2) NOT NULL,
    fuel_type VARCHAR(20) CHECK (fuel_type IN ('DIESEL','PETROL','CNG','ELECTRIC')),
    insurance_expiry DATE,
    registration_expiry DATE,
    status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE','IN_USE','MAINTENANCE','OUT_OF_SERVICE')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
);

CREATE INDEX idx_vehicles_warehouse_id ON vehicles(warehouse_id);

CREATE TRIGGER trg_vehicles_updated_at
BEFORE UPDATE ON vehicles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();