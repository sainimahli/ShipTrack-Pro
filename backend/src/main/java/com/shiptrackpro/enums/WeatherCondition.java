package com.shiptrackpro.enums;

/**
 * Optional weather signal for delay prediction. {@code CLEAR} contributes
 * no additional predicted delay.
 */
public enum WeatherCondition {
    CLEAR,
    RAIN,
    FOG,
    STORM,
    SNOW
}
