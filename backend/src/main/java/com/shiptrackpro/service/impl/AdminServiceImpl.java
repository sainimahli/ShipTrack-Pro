package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.PendingUserResponse;
import com.shiptrackpro.entity.User;
import com.shiptrackpro.entity.RegistrationStatus;
import com.shiptrackpro.repository.UserRepository;
import com.shiptrackpro.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@SuppressWarnings("null")
public class AdminServiceImpl implements AdminService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public List<PendingUserResponse> getPendingUsers() {

        return getUsersByStatus(RegistrationStatus.PENDING);
    }

    @Override
    public List<PendingUserResponse> getApprovedUsers() {

        return getUsersByStatus(RegistrationStatus.APPROVED);
    }

    @Override
    public List<PendingUserResponse> getRejectedUsers() {

        return getUsersByStatus(RegistrationStatus.REJECTED);
    }

    private List<PendingUserResponse> getUsersByStatus(RegistrationStatus status) {

        return userRepository.findByRegistrationStatus(status)
                .stream()
                .map(user -> new PendingUserResponse(
                        user.getUserId(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getEmail(),
                        user.getRole().getRoleName(),
                        user.getPhone(),
                        user.getRegistrationStatus().name()
                ))
                .toList();
    }

    @Override
    public void approveUser(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setRegistrationStatus(RegistrationStatus.APPROVED);

        userRepository.save(user);
    }

    @Override
    public void rejectUser(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setRegistrationStatus(RegistrationStatus.REJECTED);

        userRepository.save(user);
    }
}
