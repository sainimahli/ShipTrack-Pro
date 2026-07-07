package com.shiptrackpro.controller;

import com.shiptrackpro.dto.AuthResponse;
import com.shiptrackpro.dto.PendingUserResponse;
import com.shiptrackpro.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/pending-users")
    public ResponseEntity<List<PendingUserResponse>> getPendingUsers() {

        return ResponseEntity.ok(
                adminService.getPendingUsers()
        );
    }

    @PutMapping("/users/{userId}/approve")
    public ResponseEntity<AuthResponse> approveUser(
            @PathVariable Long userId) {

        adminService.approveUser(userId);

        return ResponseEntity.ok(
                new AuthResponse(
                        null,
                        null,
                        "User approved successfully."
                )
        );
    }

    @PutMapping("/users/{userId}/reject")
    public ResponseEntity<AuthResponse> rejectUser(
            @PathVariable Long userId) {

        adminService.rejectUser(userId);

        return ResponseEntity.ok(
                new AuthResponse(
                        null,
                        null,
                        "User rejected successfully."
                )
        );
    }
}