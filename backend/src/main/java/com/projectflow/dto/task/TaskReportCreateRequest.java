package com.projectflow.dto.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class TaskReportCreateRequest {

    @NotBlank(message = "is required")
    @Size(max = 2000, message = "must be at most 2000 characters")
    private String content;

    private String reportDate;

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getReportDate() {
        return reportDate;
    }

    public void setReportDate(String reportDate) {
        this.reportDate = reportDate;
    }
}
