package com.projectflow.repository;

import com.projectflow.model.Activity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, String> {
    /** Limit to latest 200 for performance; admins see global feed. */
    List<Activity> findFirst200ByOrderByTimestampDesc();
    /** Limit to latest 200 for performance; members see their own feed. */
    List<Activity> findFirst200ByUserIdOrderByTimestampDesc(String userId);
    Page<Activity> findAllByOrderByTimestampDesc(Pageable pageable);
    Page<Activity> findByUserIdOrderByTimestampDesc(String userId, Pageable pageable);
}
