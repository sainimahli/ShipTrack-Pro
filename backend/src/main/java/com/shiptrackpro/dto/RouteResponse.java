package com.shiptrackpro.dto;

public class RouteResponse {

    private String originCity;
    private String destinationCity;
    private String route;
    private double distanceKm;
    private long estimatedMinutes;
    private String estimatedTravelTime;

    public RouteResponse() {
    }

    public String getOriginCity() {
        return originCity;
    }

    public void setOriginCity(String originCity) {
        this.originCity = originCity;
    }

    public String getDestinationCity() {
        return destinationCity;
    }

    public void setDestinationCity(String destinationCity) {
        this.destinationCity = destinationCity;
    }

    public String getRoute() {
        return route;
    }

    public void setRoute(String route) {
        this.route = route;
    }

    public double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public long getEstimatedMinutes() {
        return estimatedMinutes;
    }

    public void setEstimatedMinutes(long estimatedMinutes) {
        this.estimatedMinutes = estimatedMinutes;
    }

    public String getEstimatedTravelTime() {
        return estimatedTravelTime;
    }

    public void setEstimatedTravelTime(String estimatedTravelTime) {
        this.estimatedTravelTime = estimatedTravelTime;
    }
}
