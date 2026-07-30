package com.shiptrackpro.service.impl;

import com.shiptrackpro.config.DelayPredictionProperties;
import com.shiptrackpro.dto.DelayPredictionRequest;
import com.shiptrackpro.dto.DelayPredictionResponse;
import com.shiptrackpro.entity.Shipment;
import com.shiptrackpro.enums.DelayRisk;
import com.shiptrackpro.enums.ShipmentStatus;
import com.shiptrackpro.enums.TrafficLevel;
import com.shiptrackpro.enums.WeatherCondition;
import com.shiptrackpro.exception.ResourceNotFoundException;
import com.shiptrackpro.repository.ShipmentRepository;
import com.shiptrackpro.service.DelayPredictionService;
import com.shiptrackpro.entity.User;
import com.shiptrackpro.enums.NotificationChannel;
import com.shiptrackpro.enums.NotificationEventType;
import com.shiptrackpro.repository.UserRepository;
import com.shiptrackpro.service.NotificationService;
import com.shiptrackpro.service.AlertService;
import com.shiptrackpro.dto.AlertResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.time.LocalDate;


/**
 * Rule-based implementation of {@link DelayPredictionService}.
 *
 * <p>
 * Prediction logic, in order:
 * </p>
 * <ol>
 * <li>Terminal shipments (DELIVERED, CANCELLED, FAILED_DELIVERY) are
 * never "at risk" — return LOW / 0 minutes immediately.</li>
 * <li>If the shipment has no {@code expectedDeliveryDate} set, risk
 * can't be evaluated — return LOW / 0 minutes with an explanatory
 * reason rather than guessing.</li>
 * <li>Compute how overdue the shipment already is (0 if not yet due).</li>
 * <li>If distance remaining is supplied and the shipment is actively
 * moving (IN_TRANSIT / OUT_FOR_DELIVERY / PICKED_UP), estimate
 * travel time needed at the traffic-adjusted speed and add any
 * shortfall against the time left until the ETA.</li>
 * <li>Add a flat weather-based delay estimate.</li>
 * <li>Classify total predicted delay minutes into LOW/MEDIUM/HIGH using
 * the configurable thresholds.</li>
 * </ol>
 */
@Service
@Transactional(readOnly = true)
public class RuleBasedDelayPredictionServiceImpl implements DelayPredictionService {

    private static final Set<ShipmentStatus> TERMINAL_STATUSES = EnumSet.of(ShipmentStatus.DELIVERED,
            ShipmentStatus.CANCELLED, ShipmentStatus.RETURNED);

    private static final Set<ShipmentStatus> ACTIVELY_MOVING_STATUSES = EnumSet.of(ShipmentStatus.PICKED_UP,
            ShipmentStatus.IN_TRANSIT, ShipmentStatus.OUT_FOR_DELIVERY);

    private final ShipmentRepository shipmentRepository;
    private final DelayPredictionProperties properties;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final AlertService alertService;


    public RuleBasedDelayPredictionServiceImpl(
            ShipmentRepository shipmentRepository,
            DelayPredictionProperties properties,
            NotificationService notificationService,
            UserRepository userRepository,
            AlertService alertService) {

        this.shipmentRepository = shipmentRepository;
        this.properties = properties;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.alertService = alertService;
    }

    @Override
    @Transactional
    public DelayPredictionResponse predictDelay(Long shipmentId, DelayPredictionRequest request) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found with id: " + shipmentId));

        LocalDateTime now = LocalDateTime.now();
        List<String> reasons = new ArrayList<>();

        if (TERMINAL_STATUSES.contains(shipment.getShipmentStatus())) {
            return build(shipment, DelayRisk.LOW, 0,
                    "Shipment is already in a terminal state (" + shipment.getShipmentStatus()
                            + "); no delay risk applies.",
                    now);
        }

        if (shipment.getExpectedDeliveryDate() == null) {
            return build(shipment, DelayRisk.LOW, 0,
                    "No estimated delivery date is set for this shipment, so delay risk cannot be evaluated.",
                    now);
        }

        long overdueMinutes = computeOverdueMinutes(shipment.getExpectedDeliveryDate(), now, reasons);
        long travelShortfallMinutes = computeTravelShortfall(shipment, request, now, reasons);
        long weatherDelayMinutes = computeWeatherDelay(request == null ? null : request.getWeatherCondition(), reasons);

        long predictedDelayMinutes = overdueMinutes + travelShortfallMinutes + weatherDelayMinutes;
        DelayRisk risk = classifyRisk(predictedDelayMinutes);

        String reason = reasons.isEmpty()
                ? "No significant delay factors detected; shipment is on schedule."
                : String.join(" ", reasons);

        // Save prediction into Shipment
        shipment.setDelayReason(reason);
        shipment.setIsDelayed(risk == DelayRisk.HIGH);

        shipmentRepository.save(shipment);

        AlertResponse alert = alertService.evaluateAndRaiseAlertIfNeeded(
                shipment.getShipmentId(), risk.name(), reason);

        // Send one user notification only when a new actionable alert is raised.
        if (alert != null) {
            sendDelayNotification(shipment);
        }


        return build(shipment, risk, predictedDelayMinutes, reason, now);
    }

    // ------------------------------------------------------------------
    // Rule components — each isolated so thresholds/logic can be tuned or
    // unit-tested independently, and so an ML replacement can reuse the
    // same DTO/entity shape without inheriting this class.
    // ------------------------------------------------------------------

    private long computeOverdueMinutes(LocalDate expectedDeliveryDate, LocalDateTime now, List<String> reasons)  {
        long minutesUntilDue = Duration.between(now, expectedDeliveryDate.atStartOfDay()).toMinutes();
        if (minutesUntilDue < 0) {
            long overdueBy = -minutesUntilDue;
            reasons.add("Shipment is already " + overdueBy + " minute(s) past its estimated delivery time.");
            return overdueBy;
        }
        return 0;
    }

    private long computeTravelShortfall(Shipment shipment, DelayPredictionRequest request,
                                        LocalDateTime now, List<String> reasons) {
        if (request == null || request.getDistanceRemainingKm() == null) {
            return 0;
        }
        if (!ACTIVELY_MOVING_STATUSES.contains(shipment.getShipmentStatus())) {
            return 0;
        }

        TrafficLevel trafficLevel = request.getTrafficLevel() != null ? request.getTrafficLevel() : TrafficLevel.MEDIUM;
        double speedKmh = speedForTraffic(trafficLevel);
        double requiredTravelMinutes = (request.getDistanceRemainingKm() / speedKmh) * 60.0;
        long minutesUntilDue = Math.max(0,
                Duration.between(now, shipment.getExpectedDeliveryDate().atStartOfDay()).toMinutes());


        if (requiredTravelMinutes > minutesUntilDue) {
            long shortfall = Math.round(requiredTravelMinutes - minutesUntilDue);
            reasons.add("At current speed (" + Math.round(speedKmh) + " km/h under " + trafficLevel
                    + " traffic), remaining " + request.getDistanceRemainingKm()
                    + " km trip will exceed remaining window by ~" + shortfall + " minute(s).");
            return shortfall;
        }
        return 0;
    }

    private double speedForTraffic(TrafficLevel trafficLevel) {
        return switch (trafficLevel) {
            case LOW -> properties.getLowTrafficSpeedKmh();
            case MEDIUM -> properties.getMediumTrafficSpeedKmh();
            case HIGH -> properties.getHighTrafficSpeedKmh();
        };
    }

    private long computeWeatherDelay(WeatherCondition weatherCondition, List<String> reasons) {
        if (weatherCondition == null || weatherCondition == WeatherCondition.CLEAR) {
            return 0;
        }
        long delay = switch (weatherCondition) {
            case RAIN -> properties.getRainDelayMinutes();
            case FOG -> properties.getFogDelayMinutes();
            case STORM -> properties.getStormDelayMinutes();
            case SNOW -> properties.getSnowDelayMinutes();
            case CLEAR -> 0;
        };
        if (delay > 0) {
            reasons.add(weatherCondition + " conditions add an estimated " + delay + " minute(s) of delay.");
        }
        return delay;
    }

    private DelayRisk classifyRisk(long predictedDelayMinutes) {
        if (predictedDelayMinutes >= properties.getHighThresholdMinutes()) {
            return DelayRisk.HIGH;
        }
        if (predictedDelayMinutes >= properties.getMediumThresholdMinutes()) {
            return DelayRisk.MEDIUM;
        }
        return DelayRisk.LOW;
    }

    private DelayPredictionResponse build(Shipment shipment, DelayRisk risk, long predictedDelayMinutes,
                                          String reason, LocalDateTime evaluatedAt) {
        return DelayPredictionResponse.builder()
                .shipmentId(shipment.getShipmentId())
                .delayRisk(risk)
                .predictedDelayMinutes(predictedDelayMinutes)
                .reason(reason)
                .estimatedDeliveryDate(shipment.getExpectedDeliveryDate())
                .evaluatedAt(evaluatedAt)
                .build();
    }
    private void sendDelayNotification(Shipment shipment) {

        User user = userRepository.findById(shipment.getUserId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + shipment.getUserId()));

        String title = "Shipment Delayed";

        StringBuilder message = new StringBuilder();
        message.append("Your shipment ")
                .append(shipment.getTrackingNumber())
                .append(" has been been delayed.");

        if (shipment.getDelayReason() != null &&
                !shipment.getDelayReason().isBlank()) {

            message.append("\n\nReason: ")
                    .append(shipment.getDelayReason());
        }

        if (shipment.getEstimatedArrival() != null) {

            message.append("\nUpdated ETA: ")
                    .append(shipment.getEstimatedArrival());
        }

        notificationService.createNotification(
                user,
                shipment,
                NotificationEventType.DELAYED,
                NotificationChannel.PUSH,
                title,
                message.toString()
        );
    }

}