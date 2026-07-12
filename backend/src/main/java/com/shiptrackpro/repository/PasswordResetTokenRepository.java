package com.shiptrackpro.repository;

import com.shiptrackpro.entity.PasswordResetToken;
import com.shiptrackpro.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findTopByUserAndIsUsedFalseOrderByCreatedAtDesc(User user);

    Optional<PasswordResetToken> findTopByUserAndOtpAndIsUsedFalseOrderByCreatedAtDesc(
            User user,
            String otp
    );
}