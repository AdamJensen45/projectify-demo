package com.projectflow.controller;

import com.projectflow.dto.task.TaskCreateRequest;
import com.projectflow.dto.task.TaskReportCreateRequest;
import com.projectflow.dto.task.TaskUpdateRequest;
import com.projectflow.model.Task;
import com.projectflow.model.TaskProgressReport;
import com.projectflow.model.User;
import com.projectflow.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public Object getAll(
            @RequestParam(required = false) String assignee,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @AuthenticationPrincipal User user) {
        if (page != null && size != null) {
            Pageable pageable = PageRequest.of(page, size);
            return taskService.getAllPaginated(user, assignee, search, status, priority, pageable);
        }
        return taskService.getAll(user, assignee);
    }

    @PostMapping
    public ResponseEntity<Task> create(@Valid @RequestBody TaskCreateRequest body, @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.create(body, user));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<Task> complete(@PathVariable @NonNull String id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.complete(id, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> update(@PathVariable @NonNull String id, @Valid @RequestBody TaskUpdateRequest body,
                                       @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.update(id, body, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @NonNull String id, @AuthenticationPrincipal User user) {
        taskService.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{taskId}/reports")
    public ResponseEntity<List<TaskProgressReport>> getReports(@PathVariable @NonNull String taskId,
                                                               @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.getReports(taskId, user));
    }

    @PostMapping("/{taskId}/reports")
    public ResponseEntity<TaskProgressReport> addReport(@PathVariable @NonNull String taskId,
                                                        @Valid @RequestBody TaskReportCreateRequest body,
                                                        @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.addReport(taskId, body, user));
    }
}
