package com.shiptrackpro.service;

import com.shiptrackpro.dto.RouteRequest;
import com.shiptrackpro.dto.RouteResponse;

public interface RouteService {

    RouteResponse calculateRoute(RouteRequest request);
}
