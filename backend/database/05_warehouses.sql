CREATE TABLE warehouses (
    warehouse_id BIGSERIAL PRIMARY KEY,
    warehouse_name VARCHAR(100) NOT NULL,
    warehouse_code VARCHAR(20) UNIQUE NOT NULL,
    address_id BIGINT NOT NULL,
    contact_number VARCHAR(15),
    email VARCHAR(100) UNIQUE,
    total_capacity INTEGER NOT NULL,
    current_capacity INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','MAINTENANCE')),
    manager_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_warehouse_address FOREIGN KEY (address_id) REFERENCES addresses(address_id),
    CONSTRAINT chk_capacity CHECK (current_capacity <= total_capacity)
);

CREATE INDEX idx_warehouses_address_id ON warehouses(address_id);

CREATE TRIGGER trg_warehouses_updated_at
BEFORE UPDATE ON warehouses
FOR EACH ROW EXECUTE FUNCTION set_updated_at();