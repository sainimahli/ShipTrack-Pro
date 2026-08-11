package com.shiptrackpro.service;

/**
 * SMS notification abstraction.
 *
 * When SMS_ENABLED=false the implementation logs the intended message
 * instead of making an external API call, so the application runs
 * without any SMS credentials.
 *
 * Required environment variables when SMS_ENABLED=true:
 *   SMS_ENABLED          – true/false (default: false)
 *   SMS_PROVIDER         – "twilio" (only supported provider currently)
 *   TWILIO_ACCOUNT_SID   – Twilio Account SID
 *   TWILIO_AUTH_TOKEN    – Twilio Auth Token
 *   TWILIO_FROM_NUMBER   – Twilio sender phone number (E.164 format, e.g. +15551234567)
 */
public interface SmsService {

    /**
     * Send an SMS to the given phone number.
     *
     * @param toPhoneNumber recipient in E.164 format, e.g. +919876543210
     * @param message       plain-text message body (max ~160 chars for one segment)
     */
    void send(String toPhoneNumber, String message);
}
