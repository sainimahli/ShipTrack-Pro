package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.AnalyticsDashboardResponse;
import com.shiptrackpro.dto.BusinessDashboardResponse;
import com.shiptrackpro.dto.CustomerDashboardResponse;
import com.shiptrackpro.entity.User;
import com.shiptrackpro.enums.ShipmentStatus;
import com.shiptrackpro.repository.ShipmentRepository;
import com.shiptrackpro.repository.UserRepository;
import com.shiptrackpro.service.DashboardService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;



@Service
public class DashboardServiceImpl implements DashboardService {
    private static final List<ShipmentStatus> ACTIVE_STATUSES = List.of(
            ShipmentStatus.CREATED,
            ShipmentStatus.PICKED_UP,
            ShipmentStatus.IN_TRANSIT,
            ShipmentStatus.OUT_FOR_DELIVERY
    );
    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;

    public DashboardServiceImpl(
            ShipmentRepository shipmentRepository,
            UserRepository userRepository
    ) {
        this.shipmentRepository = shipmentRepository;
        this.userRepository = userRepository;
    }

    private User getCurrentUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("Authenticated user not found"));
    }

    private long getPendingShipmentCount(Long userId) {

        return shipmentRepository.countByUserIdAndShipmentStatusIn(
                userId,
                ACTIVE_STATUSES
        );
    }

    private long getActiveShipmentCount(Long userId) {
        return getPendingShipmentCount(userId);
    }

    private double calculateDeliverySuccessRate(
            long delivered,
            long total
    ) {

        if (total == 0) {
            return 0;
        }

        return Math.round((delivered * 10000.0) / total) / 100.0;
    }
    @Override
    public CustomerDashboardResponse getCustomerDashboard() {

        User currentUser = getCurrentUser();

        Long userId = currentUser.getUserId();

        long totalShipments =
                shipmentRepository.countByUserId(userId);

        long activeShipments =
                getActiveShipmentCount(userId);

        long pendingShipments =
                getPendingShipmentCount(userId);

        long deliveredShipments =
                shipmentRepository.countByUserIdAndShipmentStatus(
                        userId,
                        ShipmentStatus.DELIVERED
                );

        long failedShipments =
                shipmentRepository.countByUserIdAndShipmentStatus(
                        userId,
                        ShipmentStatus.FAILED_DELIVERY
                );

        long cancelledShipments =
                shipmentRepository.countByUserIdAndShipmentStatus(
                        userId,
                        ShipmentStatus.CANCELLED
                );

        return CustomerDashboardResponse.builder()
                .activeShipments(activeShipments)
                .totalShipments(totalShipments)
                .deliveredShipments(deliveredShipments)
                .pendingShipments(pendingShipments)
                .failedShipments(failedShipments)
                .cancelledShipments(cancelledShipments)
                .build();
    }

    @Override
    public BusinessDashboardResponse getBusinessDashboard() {

        User currentUser = getCurrentUser();

        Long userId = currentUser.getUserId();

        long totalShipments =
                shipmentRepository.countByUserId(userId);

        long activeShipments =
                getActiveShipmentCount(userId);

        long completedShipments =
                shipmentRepository.countByUserIdAndShipmentStatus(
                        userId,
                        ShipmentStatus.DELIVERED
                );

        long failedShipments =
                shipmentRepository.countByUserIdAndShipmentStatus(
                        userId,
                        ShipmentStatus.FAILED_DELIVERY
                );

        long delayedShipments =
                shipmentRepository.countByUserIdAndIsDelayedTrue(userId);

        double deliverySuccessRate =
                calculateDeliverySuccessRate(
                        completedShipments,
                        totalShipments
                );

        return BusinessDashboardResponse.builder()
                .totalShipments(totalShipments)
                .activeShipments(activeShipments)
                .completedShipments(completedShipments)
                .failedShipments(failedShipments)
                .delayedShipments(delayedShipments)
                .deliverySuccessRate(deliverySuccessRate)
                .build();
    }
    @Override
    public AnalyticsDashboardResponse getAnalyticsDashboard() {

        long totalShipments = shipmentRepository.count();

        long pendingShipments =
                shipmentRepository.countByShipmentStatus(ShipmentStatus.CREATED)
                        + shipmentRepository.countByShipmentStatus(ShipmentStatus.PICKED_UP)
                        + shipmentRepository.countByShipmentStatus(ShipmentStatus.IN_TRANSIT)
                        + shipmentRepository.countByShipmentStatus(ShipmentStatus.OUT_FOR_DELIVERY);

        long successfulShipments =
                shipmentRepository.countByShipmentStatus(ShipmentStatus.DELIVERED);

        long failedShipments =
                shipmentRepository.countByShipmentStatus(ShipmentStatus.FAILED_DELIVERY);

        long cancelledShipments =
                shipmentRepository.countByShipmentStatus(ShipmentStatus.CANCELLED);

        long returnedShipments =
                shipmentRepository.countByShipmentStatus(ShipmentStatus.RETURNED);

        double deliverySuccessRate =
                calculateDeliverySuccessRate(
                        successfulShipments,
                        totalShipments
                );

        long customers =
                userRepository.countByRole_RoleName("CUSTOMER");

        long businessClients =
                userRepository.countByRole_RoleName("BUSINESS_CLIENT");

        long logisticsOperators =
                userRepository.countByRole_RoleName("LOGISTICS_OPERATOR");

        long supportAgents =
                userRepository.countByRole_RoleName("SUPPORT_AGENT");

        long administrators =
                userRepository.countByRole_RoleName("ADMINISTRATOR");

        return AnalyticsDashboardResponse.builder()
                .totalShipments(totalShipments)
                .pendingShipments(pendingShipments)
                .successfulShipments(successfulShipments)
                .failedShipments(failedShipments)
                .cancelledShipments(cancelledShipments)
                .returnedShipments(returnedShipments)
                .customers(customers)
                .businessClients(businessClients)
                .logisticsOperators(logisticsOperators)
                .supportAgents(supportAgents)
                .administrators(administrators)
                .deliverySuccessRate(deliverySuccessRate)
                .build();
    }
}