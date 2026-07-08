CREATE TABLE business_clients (
    business_client_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    gst_number VARCHAR(20) UNIQUE,
    business_type VARCHAR(50),
    website VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_business_client_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TRIGGER trg_business_clients_updated_at
BEFORE UPDATE ON business_clients
FOR EACH ROW EXECUTE FUNCTION set_updated_at();