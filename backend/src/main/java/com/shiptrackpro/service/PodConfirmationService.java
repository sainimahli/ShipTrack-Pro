package com.shiptrackpro.service;

import com.shiptrackpro.dto.PodConfirmationRequest;
import com.shiptrackpro.dto.PodConfirmationResponse;
import com.shiptrackpro.dto.PodConfirmationListResponse;
import java.util.List;

public interface PodConfirmationService {

    PodConfirmationResponse createConfirmation(PodConfirmationRequest request);

    PodConfirmationResponse confirmDelivery(Long confirmationId);

    List<PodConfirmationListResponse> getAllConfirmations();
}

