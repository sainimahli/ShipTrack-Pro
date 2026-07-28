package com.shiptrackpro.service;

import com.shiptrackpro.dto.ForecastResponse;

public interface ForecastService {

    ForecastResponse getForecast(Long shipmentId);

}