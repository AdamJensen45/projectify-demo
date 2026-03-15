package com.projectflow.controller;

import com.projectflow.model.TaskProgressReport;
import com.projectflow.model.User;
import com.projectflow.repository.TaskProgressReportRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final TaskProgressReportRepository reportRepository;

    public ReportController(TaskProgressReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    @GetMapping("/me")
    public List<TaskProgressReport> getMyReports(@AuthenticationPrincipal User user) {
        return reportRepository.findByUserIdOrderByReportDateDescCreatedAtDesc(user.getId());
    }
}
