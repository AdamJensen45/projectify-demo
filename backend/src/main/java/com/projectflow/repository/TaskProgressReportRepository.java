package com.projectflow.repository;

import com.projectflow.model.TaskProgressReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskProgressReportRepository extends JpaRepository<TaskProgressReport, String> {

    List<TaskProgressReport> findByTaskIdOrderByReportDateDescCreatedAtDesc(String taskId);

    List<TaskProgressReport> findByUserIdOrderByReportDateDescCreatedAtDesc(String userId);
}
