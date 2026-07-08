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
public class AdminServiceImpl implements AdminService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public List<PendingUserResponse> getPendingUsers() {

        return userRepository.findByRegistrationStatus(RegistrationStatus.PENDING)
                .stream()
                .map(user -> new PendingUserResponse(
                        user.getUserId(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getEmail(),
                        user.getRole().getRoleName(),
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