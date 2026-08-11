package com.shiptrackpro.service;

import com.shiptrackpro.service.impl.SmsServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

/**
 * Unit tests for SmsServiceImpl.
 *
 * When SMS_ENABLED=false (the default) no external call must be made and
 * the service must never throw.
 */
@ExtendWith(MockitoExtension.class)
class SmsServiceImplTest {

    private SmsServiceImpl buildService(boolean enabled) {
        SmsServiceImpl svc = new SmsServiceImpl();
        ReflectionTestUtils.setField(svc, "smsEnabled", enabled);
        ReflectionTestUtils.setField(svc, "smsProvider", "twilio");
        ReflectionTestUtils.setField(svc, "twilioAccountSid", "");
        ReflectionTestUtils.setField(svc, "twilioAuthToken", "");
        ReflectionTestUtils.setField(svc, "twilioFromNumber", "");
        return svc;
    }

    @Test
    void send_WhenDisabled_DoesNotThrow() {
        SmsServiceImpl svc = buildService(false);
        // Must log and return — no exception even with an empty phone number
        assertDoesNotThrow(() -> svc.send("+919876543210", "Test message"));
    }

    @Test
    void send_WhenDisabledWithNullPhone_DoesNotThrow() {
        SmsServiceImpl svc = buildService(false);
        assertDoesNotThrow(() -> svc.send(null, "Test message"));
    }

    @Test
    void send_WhenEnabledButMissingCredentials_DoesNotThrow() {
        // Enabled but credentials blank → should log error, not throw
        SmsServiceImpl svc = buildService(true);
        assertDoesNotThrow(() -> svc.send("+919876543210", "Test"));
    }
}
