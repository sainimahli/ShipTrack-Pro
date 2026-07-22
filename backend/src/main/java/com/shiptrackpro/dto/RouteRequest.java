package com.shiptrackpro.dto;

import jakarta.validation.constraints.NotBlank;

public class RouteRequest {

    @NotBlank
    private String originCity;

    @NotBlank
    private String destinationCity;

    public RouteRequest() {
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
}
