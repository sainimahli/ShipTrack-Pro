-- Migration: Create device_tokens table for FCM push notifications
-- Safe to run multiple times (IF NOT EXISTS guards)

CREATE TABLE IF NOT EXISTS device_tokens (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT        NOT NULL,
    device_token VARCHAR(512)  NOT NULL,
    platform     VARCHAR(20),
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ,
    CONSTRAINT uq_device_tokens_user_token UNIQUE (user_id, device_token)
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens (user_id);
