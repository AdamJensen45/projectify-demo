package com.projectflow.repository;

import com.projectflow.model.ProjectMembership;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectMembershipRepository extends JpaRepository<ProjectMembership, String> {
    List<ProjectMembership> findByUserId(String userId);
    List<ProjectMembership> findByProjectId(String projectId);
    boolean existsByUserIdAndProjectId(String userId, String projectId);
}
