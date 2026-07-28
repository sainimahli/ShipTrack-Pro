package com.shiptrackpro.dto;

public class RouteResponse {

    private String originCity;
    private String destinationCity;
    private Long originAddressId;
    private Long destinationAddressId;
    private Long originId;
    private Long destinationId;
    private String route;
    private double distanceKm;
    private long estimatedMinutes;
    private String estimatedTravelTime;
    private double[] originCoords;
    private double[] destinationCoords;

    public RouteResponse() {
    }

    public double[] getOriginCoords() {
        return originCoords;
    }

    public void setOriginCoords(double[] originCoords) {
        this.originCoords = originCoords;
    }

    public double[] getDestinationCoords() {
        return destinationCoords;
    }

    public void setDestinationCoords(double[] destinationCoords) {
        this.destinationCoords = destinationCoords;
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

    public Long getOriginAddressId() {
        return originAddressId;
    }

    public void setOriginAddressId(Long originAddressId) {
        this.originAddressId = originAddressId;
        this.originId = originAddressId;
    }

    public Long getDestinationAddressId() {
        return destinationAddressId;
    }

    public void setDestinationAddressId(Long destinationAddressId) {
        this.destinationAddressId = destinationAddressId;
        this.destinationId = destinationAddressId;
    }

    public Long getOriginId() {
        return originId;
    }

    public void setOriginId(Long originId) {
        this.originId = originId;
        this.originAddressId = originId;
    }

    public Long getDestinationId() {
        return destinationId;
    }

    public void setDestinationId(Long destinationId) {
        this.destinationId = destinationId;
        this.destinationAddressId = destinationId;
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
