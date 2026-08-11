package com.shiptrackpro.service;

import com.shiptrackpro.dto.ShipmentResponse;
import com.shiptrackpro.entity.Shipment;
import com.shiptrackpro.entity.User;
import com.shiptrackpro.enums.ShipmentStatus;
import com.shiptrackpro.repository.AddressRepository;
import com.shiptrackpro.repository.ShipmentRepository;
import com.shiptrackpro.repository.TrackingEventRepository;
import com.shiptrackpro.repository.UserRepository;
import com.shiptrackpro.service.impl.ShipmentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Security-focused unit tests for ShipmentServiceImpl.
 *
 * Verifies that customer-scoped data isolation is enforced at the
 * service layer: getMyShipments() only returns the calling user's
 * shipments and cannot be tricked into returning another user's data.
 */
@ExtendWith(MockitoExtension.class)
class ShipmentServiceImplSecurityTest {

    @Mock private ShipmentRepository shipmentRepository;
    @Mock private AddressRepository addressRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;
    @Mock private TrackingService trackingService;
    @Mock private TrackingEventRepository trackingEventRepository;
    @Mock private AccountActivityService accountActivityService;

    private ShipmentServiceImpl service;

    // Two distinct users
    private static final Long USER_A = 1L;
    private static final Long USER_B = 2L;

    @BeforeEach
    void setUp() {
        service = new ShipmentServiceImpl(
                shipmentRepository, addressRepository, userRepository,
                notificationService, trackingService, trackingEventRepository,
                accountActivityService);
    }

    private Shipment buildShipment(Long shipmentId, Long ownerId, String tracking) {
        Shipment s = new Shipment();
        s.setShipmentId(shipmentId);
        s.setUserId(ownerId);
        s.setTrackingNumber(tracking);
        s.setShipmentStatus(ShipmentStatus.CREATED);
        s.setSenderAddressId(10L);
        s.setReceiverAddressId(20L);
        return s;
    }

    // ── getMyShipments ────────────────────────────────────────────────────────

    @Test
    void getMyShipments_ReturnsOnlyOwnerShipments() {
        Shipment shipA = buildShipment(1L, USER_A, "SHIP-AAAA0001");
        when(shipmentRepository.findByUserId(USER_A)).thenReturn(List.of(shipA));

        List<ShipmentResponse> result = service.getMyShipments(USER_A);

        assertEquals(1, result.size());
        // Verify the repository was called with the correct userId — not a wildcard
        verify(shipmentRepository, times(1)).findByUserId(USER_A);
        verify(shipmentRepository, never()).findByUserId(USER_B);
    }

    @Test
    void getMyShipments_DoesNotReturnOtherUsersShipments() {
        // Only stub USER_A's repository call. Not stubbing USER_B is intentional:
        // if the service ever called findByUserId(USER_B), Mockito strict mode
        // would report an unexpected interaction, surfacing the security bug.
        when(shipmentRepository.findByUserId(USER_A)).thenReturn(List.of());

        List<ShipmentResponse> resultForA = service.getMyShipments(USER_A);
        assertTrue(resultForA.isEmpty(),
                "User A must not receive User B's shipments");
        // Confirm the service never touched User B's data
        verify(shipmentRepository, never()).findByUserId(USER_B);
    }

    @Test
    void getMyShipments_WhenUserHasNone_ReturnsEmptyList() {
        when(shipmentRepository.findByUserId(USER_A)).thenReturn(List.of());
        List<ShipmentResponse> result = service.getMyShipments(USER_A);
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    // ── senderName persistence ────────────────────────────────────────────────

    @Test
    void senderName_IsStoredAndReturnedCorrectly() {
        // Regression test: senderName must be persisted, not read from User account
        Shipment s = buildShipment(1L, USER_A, "SHIP-TEST001");
        s.setSenderName("Arun Kumar");   // stored separately from user account name
        when(shipmentRepository.findByUserId(USER_A)).thenReturn(List.of(s));

        User user = new User();
        user.setUserId(USER_A);
        user.setFirstName("Different");  // account name differs from sender name
        user.setLastName("Name");
        when(userRepository.findById(USER_A)).thenReturn(Optional.of(user));

        List<ShipmentResponse> results = service.getMyShipments(USER_A);
        // The response must use the stored senderName, not the account name
        assertEquals("Arun Kumar", results.get(0).getSenderName());
    }
}
