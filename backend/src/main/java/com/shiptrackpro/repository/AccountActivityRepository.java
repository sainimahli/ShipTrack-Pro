package com.shiptrackpro.repository;

import com.shiptrackpro.entity.AccountActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccountActivityRepository extends JpaRepository<AccountActivity, Long> {

    /** Return all activity records for one user, newest first. */
    List<AccountActivity> findByUserIdOrderByCreatedAtDesc(Long userId);
}
