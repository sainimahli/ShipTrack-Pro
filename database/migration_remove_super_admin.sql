BEGIN;

UPDATE users
SET role_id = (SELECT role_id FROM roles WHERE role_name = 'ADMINISTRATOR')
WHERE role_id = (SELECT role_id FROM roles WHERE role_name = 'SUPER_ADMIN');

DELETE FROM roles WHERE role_name = 'SUPER_ADMIN';

COMMIT;
