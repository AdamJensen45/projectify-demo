package com.projectflow.repository;

import com.projectflow.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, String> {
    List<Task> findByAssignee_Id(String assigneeId);

    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.assignee WHERE t.projectId = :projectId")
    List<Task> findByProjectId(@Param("projectId") String projectId);

    boolean existsByProjectIdAndNameIgnoreCase(String projectId, String name);
}
