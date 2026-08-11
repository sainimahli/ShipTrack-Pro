package com.shiptrackpro.service;

import com.shiptrackpro.entity.DeviceToken;
import com.shiptrackpro.repository.DeviceTokenRepository;
import com.shiptrackpro.service.impl.PushNotificationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PushNotificationServiceImplTest {

    @Mock
    private DeviceTokenRepository deviceTokenRepository;

    private PushNotificationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PushNotificationServiceImpl(deviceTokenRepository);
        ReflectionTestUtils.setField(service, "fcmEnabled", false);
        ReflectionTestUtils.setField(service, "firebaseProjectId", "");
    }

    @Test
    void registerToken_NewToken_SavesIt() {
        when(deviceTokenRepository.findByUserIdAndDeviceToken(1L, "token123"))
                .thenReturn(Optional.empty());

        service.registerToken(1L, "token123", "android");
        verify(deviceTokenRepository).save(any(DeviceToken.class));
    }

    @Test
    void registerToken_DuplicateToken_DoesNotSaveTwice() {
        when(deviceTokenRepository.findByUserIdAndDeviceToken(1L, "token123"))
                .thenReturn(Optional.of(new DeviceToken()));

        service.registerToken(1L, "token123", "android");
        verify(deviceTokenRepository, never()).save(any());
    }

    @Test
    void registerToken_BlankToken_IsIgnored() {
        service.registerToken(1L, "", "android");
        verify(deviceTokenRepository, never()).save(any());
    }

    @Test
    void sendToUser_WhenFcmDisabled_DoesNotThrow() {
        // fcmEnabled=false → returns early before any repository call
        assertDoesNotThrow(() -> service.sendToUser(1L, "Hello", "World"));
    }

    @Test
    void sendToUser_WhenNoTokensRegistered_DoesNotThrow() {
        // Even with a valid userId, disabled FCM must not crash
        assertDoesNotThrow(() -> service.sendToUser(99L, "Hello", "World"));
    }
}
