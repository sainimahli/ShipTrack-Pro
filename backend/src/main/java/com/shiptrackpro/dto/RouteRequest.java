package com.shiptrackpro.dto;

public class RouteRequest {

    private String originCity;
    private String destinationCity;

    private Long originAddressId;
    private Long destinationAddressId;

    private Long originId;
    private Long destinationId;

    public RouteRequest() {
    }

    public RouteRequest(String originCity, String destinationCity) {
        this.originCity = originCity;
        this.destinationCity = destinationCity;
    }

    public RouteRequest(Long originId, Long destinationId) {
        this.originId = originId;
        this.destinationId = destinationId;
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
    }

    public Long getDestinationAddressId() {
        return destinationAddressId;
    }

    public void setDestinationAddressId(Long destinationAddressId) {
        this.destinationAddressId = destinationAddressId;
    }

    public Long getOriginId() {
        return originId;
    }

    public void setOriginId(Long originId) {
        this.originId = originId;
    }

    public Long getDestinationId() {
        return destinationId;
    }

    public void setDestinationId(Long destinationId) {
        this.destinationId = destinationId;
    }

    public Long getEffectiveOriginId() {
        return originId != null ? originId : originAddressId;
    }

    public Long getEffectiveDestinationId() {
        return destinationId != null ? destinationId : destinationAddressId;
    }
}

