package com.shiptrackpro.service.impl;

import com.shiptrackpro.service.SmsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * SMS service implementation.
 *
 * When {@code sms.enabled=false} (the default) no external call is made;
 * the intended message is logged at INFO level so it is visible during
 * development and demos.
 *
 * When {@code sms.enabled=true} and provider = "twilio", the Twilio REST
 * API is called via a simple HTTP POST (no Twilio SDK dependency required —
 * keeping the dependency footprint small). Add the Twilio Java SDK to
 * pom.xml if richer features are needed.
 *
 * Environment variables required for live SMS:
 *   SMS_ENABLED=true
 *   SMS_PROVIDER=twilio
 *   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   TWILIO_FROM_NUMBER=+15551234567
 */
@Service
public class SmsServiceImpl implements SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsServiceImpl.class);

    @Value("${sms.enabled:false}")
    private boolean smsEnabled;

    @Value("${sms.provider:twilio}")
    private String smsProvider;

    @Value("${twilio.account-sid:}")
    private String twilioAccountSid;

    @Value("${twilio.auth-token:}")
    private String twilioAuthToken;

    @Value("${twilio.from-number:}")
    private String twilioFromNumber;

    @Override
    public void send(String toPhoneNumber, String message) {
        if (!smsEnabled) {
            log.info("[SMS DISABLED] Would send to {}: {}", toPhoneNumber, message);
            return;
        }

        if (toPhoneNumber == null || toPhoneNumber.isBlank()) {
            log.warn("SMS skipped — recipient phone number is empty.");
            return;
        }

        if ("twilio".equalsIgnoreCase(smsProvider)) {
            sendViaTwilio(toPhoneNumber, message);
        } else {
            log.warn("Unknown SMS provider '{}' — message not sent.", smsProvider);
        }
    }

    private void sendViaTwilio(String to, String body) {
        if (twilioAccountSid.isBlank() || twilioAuthToken.isBlank() || twilioFromNumber.isBlank()) {
            log.error("Twilio credentials missing. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER.");
            return;
        }

        try {
            // Use standard Java HTTP without requiring the Twilio SDK library
            String url = "https://api.twilio.com/2010-04-01/Accounts/" + twilioAccountSid + "/Messages.json";
            String payload = "To=" + java.net.URLEncoder.encode(to, java.nio.charset.StandardCharsets.UTF_8)
                    + "&From=" + java.net.URLEncoder.encode(twilioFromNumber, java.nio.charset.StandardCharsets.UTF_8)
                    + "&Body=" + java.net.URLEncoder.encode(body, java.nio.charset.StandardCharsets.UTF_8);

            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(url))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .header("Authorization", "Basic " + java.util.Base64.getEncoder()
                            .encodeToString((twilioAccountSid + ":" + twilioAuthToken)
                                    .getBytes(java.nio.charset.StandardCharsets.UTF_8)))
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            java.net.http.HttpResponse<String> response =
                    client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("SMS sent to {} via Twilio.", to);
            } else {
                log.error("Twilio SMS failed. Status: {} Body: {}", response.statusCode(), response.body());
            }
        } catch (Exception ex) {
            log.error("SMS send error: {}", ex.getMessage());
        }
    }
}
