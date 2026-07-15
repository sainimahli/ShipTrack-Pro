INSERT INTO roles (role_name, description, is_self_registerable) VALUES
('CUSTOMER', 'Individual customer who books and tracks shipments', TRUE),
('BUSINESS_CLIENT', 'Business account holder with company shipment needs', TRUE),
('LOGISTICS_OPERATOR', 'Staff managing warehouse and shipment operations', FALSE),
('SUPPORT_AGENT', 'Customer support staff handling queries and issues', FALSE),
('ADMINISTRATOR', 'Full system access and management', FALSE),
('SUPER_ADMIN', 'Highest-level system owner with unrestricted administration access', FALSE);
