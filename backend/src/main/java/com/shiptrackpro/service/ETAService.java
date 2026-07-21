package com.shiptrackpro.service;

import com.shiptrackpro.dto.ETAResponse;

public interface ETAService {

    ETAResponse getETA(String trackingNumber);
}