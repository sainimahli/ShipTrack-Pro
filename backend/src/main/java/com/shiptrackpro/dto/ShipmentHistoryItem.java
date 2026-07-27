package com.shiptrackpro.dto;

import java.time.OffsetDateTime;

public record ShipmentHistoryItem(String status, String location, OffsetDateTime timestamp) {
}
