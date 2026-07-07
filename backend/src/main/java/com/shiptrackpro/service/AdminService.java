package com.shiptrackpro.service;

import com.shiptrackpro.dto.PendingUserResponse;

import java.util.List;

public interface AdminService {

    List<PendingUserResponse> getPendingUsers();

    void approveUser(Long userId);

    void rejectUser(Long userId);

}