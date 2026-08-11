package com.shiptrackpro.service;

import com.shiptrackpro.dto.AccountActivityResponse;
import com.shiptrackpro.entity.AccountActivity;
import com.shiptrackpro.repository.AccountActivityRepository;
import com.shiptrackpro.service.impl.AccountActivityServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountActivityServiceImplTest {

    @Mock
    private AccountActivityRepository accountActivityRepository;

    private AccountActivityServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AccountActivityServiceImpl(accountActivityRepository);
    }

    // ── record() ──────────────────────────────────────────────────────────────

    @Test
    void record_WithValidUserId_SavesActivity() {
        service.record(1L, "LOGIN_SUCCESS", "Logged in.", true, "127.0.0.1");
        verify(accountActivityRepository, times(1)).save(any(AccountActivity.class));
    }

    @Test
    void record_WithNullUserId_DoesNotSave() {
        // Cannot record activity when userId is unknown
        service.record(null, "LOGIN_SUCCESS", "Logged in.", true, null);
        verify(accountActivityRepository, never()).save(any());
    }

    @Test
    void record_WhenRepositoryThrows_DoesNotPropagateException() {
        when(accountActivityRepository.save(any())).thenThrow(new RuntimeException("DB error"));
        // Must NOT throw — audit failures must never crash the main flow
        assertDoesNotThrow(() ->
                service.record(1L, "LOGIN_SUCCESS", "Test", true, null));
    }

    // ── getActivityForUser() ──────────────────────────────────────────────────

    @Test
    void getActivityForUser_ReturnsOnlyThatUsersActivity() {
        AccountActivity a = new AccountActivity(
                1L, 42L, "LOGIN_SUCCESS", "Logged in.", true, null, OffsetDateTime.now());
        when(accountActivityRepository.findByUserIdOrderByCreatedAtDesc(42L))
                .thenReturn(List.of(a));

        List<AccountActivityResponse> result = service.getActivityForUser(42L);

        assertEquals(1, result.size());
        assertEquals("LOGIN_SUCCESS", result.get(0).getAction());
        assertTrue(result.get(0).isSuccess());
    }

    @Test
    void getActivityForUser_WhenNoActivity_ReturnsEmptyList() {
        when(accountActivityRepository.findByUserIdOrderByCreatedAtDesc(99L))
                .thenReturn(List.of());

        List<AccountActivityResponse> result = service.getActivityForUser(99L);
        assertTrue(result.isEmpty());
    }
}
