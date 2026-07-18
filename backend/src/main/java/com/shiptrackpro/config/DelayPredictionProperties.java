package com.shiptrackpro.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Tunable thresholds and per-factor delay estimates for the rule-based
 * delay prediction engine. Externalized here (bound from
 * {@code app.delay-prediction.*} in application.properties) so risk
 * thresholds and alerting sensitivity can be adjusted without touching
 * code or redeploying a new JAR.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.delay-prediction")
public class DelayPredictionProperties {

    /** predictedDelayMinutes at or above this value → MEDIUM risk. */
    private long mediumThresholdMinutes = 20;

    /** predictedDelayMinutes at or above this value → HIGH risk. */
    private long highThresholdMinutes = 60;

    /** Assumed average speed (km/h) under LOW traffic, used to estimate travel time. */
    private double lowTrafficSpeedKmh = 50;

    /** Assumed average speed (km/h) under MEDIUM traffic. */
    private double mediumTrafficSpeedKmh = 30;

    /** Assumed average speed (km/h) under HIGH traffic. */
    private double highTrafficSpeedKmh = 15;

    /** Extra predicted delay (minutes) added for RAIN. */
    private long rainDelayMinutes = 15;

    /** Extra predicted delay (minutes) added for FOG. */
    private long fogDelayMinutes = 20;

    /** Extra predicted delay (minutes) added for STORM. */
    private long stormDelayMinutes = 40;

    /** Extra predicted delay (minutes) added for SNOW. */
    private long snowDelayMinutes = 35;

}
