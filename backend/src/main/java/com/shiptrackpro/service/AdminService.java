package com.shiptrackpro.service;

import com.shiptrackpro.dto.PendingUserResponse;

import java.util.List;

public interface AdminService {

    List<PendingUserResponse> getPendingUsers();

    List<PendingUserResponse> getApprovedUsers();

    List<PendingUserResponse> getRejectedUsers();

    void approveUser(Long userId);

    void rejectUser(Long userId);

}
