package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.AccountActivityResponse;
import com.shiptrackpro.entity.AccountActivity;
import com.shiptrackpro.repository.AccountActivityRepository;
import com.shiptrackpro.service.AccountActivityService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountActivityServiceImpl implements AccountActivityService {

    private static final Logger log = LoggerFactory.getLogger(AccountActivityServiceImpl.class);

    private final AccountActivityRepository accountActivityRepository;

    @Override
    @Transactional
    public void record(Long userId, String action, String description,
                       boolean success, String ipAddress) {
        if (userId == null) {
            // Cannot record activity for unknown user (e.g. failed login with non-existent email)
            log.debug("Account activity not recorded — no userId for action: {}", action);
            return;
        }
        try {
            AccountActivity activity = AccountActivity.builder()
                    .userId(userId)
                    .action(action)
                    .description(description)
                    .success(success)
                    .ipAddress(ipAddress)
                    .build();
            accountActivityRepository.save(activity);
        } catch (Exception ex) {
            // Never let audit failure crash the main flow
            log.error("Failed to record account activity [{}/{}]: {}", userId, action, ex.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccountActivityResponse> getActivityForUser(Long userId) {
        return accountActivityRepository
                .findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(a -> new AccountActivityResponse(
                        a.getId(),
                        a.getAction(),
                        a.getDescription(),
                        a.isSuccess(),
                        a.getIpAddress(),
                        a.getCreatedAt()))
                .toList();
    }
}
