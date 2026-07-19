package com.shiptrackpro.dto;

import java.util.List;

public class TrackingTimelineResponse {

    private String trackingNumber;
    private List<TrackingLocationResponse> events;

    public TrackingTimelineResponse() {
    }

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }

    public List<TrackingLocationResponse> getEvents() {
        return events;
    }

    public void setEvents(List<TrackingLocationResponse> events) {
        this.events = events;
    }
}