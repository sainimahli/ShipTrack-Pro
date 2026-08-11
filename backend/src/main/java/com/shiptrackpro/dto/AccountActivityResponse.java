package com.shiptrackpro.dto;

import java.time.OffsetDateTime;

public class AccountActivityResponse {

    private Long id;
    private String action;
    private String description;
    private boolean success;
    private String ipAddress;
    private OffsetDateTime createdAt;

    public AccountActivityResponse() {}

    public AccountActivityResponse(Long id, String action, String description,
                                   boolean success, String ipAddress, OffsetDateTime createdAt) {
        this.id = id;
        this.action = action;
        this.description = description;
        this.success = success;
        this.ipAddress = ipAddress;
        this.createdAt = createdAt;
    }

    public Long getId()                 { return id; }
    public String getAction()           { return action; }
    public String getDescription()      { return description; }
    public boolean isSuccess()          { return success; }
    public String getIpAddress()        { return ipAddress; }
    public OffsetDateTime getCreatedAt(){ return createdAt; }
}
