package com.projectflow.repository;

import com.projectflow.model.Activity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, String> {
    List<Activity> findAllByOrderByTimestampDesc();
    List<Activity> findByUserIdOrderByTimestampDesc(String userId);
}
