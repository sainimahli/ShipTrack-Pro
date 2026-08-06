package com.shiptrackpro.repository;

import com.shiptrackpro.entity.RegistrationStatus;
import com.shiptrackpro.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    List<User> findByRegistrationStatus(
            RegistrationStatus registrationStatus
    );

    // -------------------------
    // Admin Dashboard
    // -------------------------

    long countByRole_RoleName(String roleName);
}