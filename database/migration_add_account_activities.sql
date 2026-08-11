-- Migration: Create account_activities table for audit logging
-- Safe to run multiple times (IF NOT EXISTS guards)

CREATE TABLE IF NOT EXISTS account_activities (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT        NOT NULL,
    action         VARCHAR(100)  NOT NULL,
    description    VARCHAR(500),
    success        BOOLEAN       NOT NULL DEFAULT TRUE,
    ip_address     VARCHAR(64),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_activity_user_id
    ON account_activities (user_id);
