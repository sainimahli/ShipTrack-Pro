package com.shiptrackpro.repository;

import com.shiptrackpro.entity.DeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {
    List<DeviceToken> findByUserId(Long userId);
    Optional<DeviceToken> findByUserIdAndDeviceToken(Long userId, String deviceToken);
    void deleteByUserIdAndDeviceToken(Long userId, String deviceToken);
}
