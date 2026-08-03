package com.shiptrackpro.dto;

public class MapConfigResponse {
    private String apiKey;
    private String defaultCenter;
    private boolean keyValid;

    public MapConfigResponse() {
    }

    public MapConfigResponse(String apiKey, String defaultCenter, boolean keyValid) {
        this.apiKey = apiKey;
        this.defaultCenter = defaultCenter;
        this.keyValid = keyValid;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getDefaultCenter() {
        return defaultCenter;
    }

    public void setDefaultCenter(String defaultCenter) {
        this.defaultCenter = defaultCenter;
    }

    public boolean isKeyValid() {
        return keyValid;
    }

    public void setKeyValid(boolean keyValid) {
        this.keyValid = keyValid;
    }
}
