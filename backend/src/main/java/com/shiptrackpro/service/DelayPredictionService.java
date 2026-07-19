package com.shiptrackpro.service;

import com.shiptrackpro.dto.DelayPredictionRequest;
import com.shiptrackpro.dto.DelayPredictionResponse;

/**
 * Predicts the likelihood and magnitude of delivery delay for a shipment.
 *
 * <p>This is the seam for swapping prediction strategies later without
 * touching {@code DelayPredictionController} or anything downstream (e.g.
 * the future Delay Alerts feature). Today's implementation,
 * {@code RuleBasedDelayPredictionServiceImpl}, uses fixed rules and
 * configurable thresholds. A future ML-based implementation can be added
 * simply by:</p>
 * <ol>
 *     <li>Creating {@code MlDelayPredictionServiceImpl implements DelayPredictionService}</li>
 *     <li>Marking it {@code @Primary} (or using a {@code @Qualifier}/feature
 *         flag to choose between them) so Spring injects it instead</li>
 * </ol>
 * <p>No changes would be needed to the controller or any other consumer
 * of this interface.</p>
 */
public interface DelayPredictionService {

    /**
     * Predicts delay risk for a shipment using its stored status and
     * estimated delivery date, combined with the live signals in
     * {@code request}.
     *
     * @param shipmentId id of the shipment to evaluate
     * @param request    live traffic/weather/distance signals
     * @return the prediction result
     * @throws com.shiptrackpro.exception.ResourceNotFoundException if no shipment exists with the given id
     */
    DelayPredictionResponse predictDelay(Long shipmentId, DelayPredictionRequest request);

}