package com.projectflow.controller;

import com.projectflow.dto.task.TaskCreateRequest;
import com.projectflow.dto.task.TaskReportCreateRequest;
import com.projectflow.dto.task.TaskUpdateRequest;
import com.projectflow.model.Task;
import com.projectflow.model.TaskProgressReport;
import com.projectflow.model.TaskStatus;
import com.projectflow.model.User;
import com.projectflow.repository.TaskProgressReportRepository;
import com.projectflow.repository.TaskRepository;
import com.projectflow.repository.UserRepository;
import com.projectflow.service.ActivityService;
import com.projectflow.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final TaskProgressReportRepository reportRepository;
    private final ActivityService activityService;
    private final TaskService taskService;

    public TaskController(TaskRepository taskRepository, UserRepository userRepository,
                          TaskProgressReportRepository reportRepository,
                          ActivityService activityService,
                          TaskService taskService) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.reportRepository = reportRepository;
        this.activityService = activityService;
        this.taskService = taskService;
    }

    @GetMapping
    public List<Task> getAll(@RequestParam(required = false) String assignee, @AuthenticationPrincipal User user) {
        return taskService.getAll(user, assignee);
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody TaskCreateRequest body, @AuthenticationPrincipal User user) {
        String name = body.getName().trim();
        String projectId = body.getProjectId();
        if (taskRepository.existsByProjectIdAndNameIgnoreCase(projectId, name)) {
            return ResponseEntity.badRequest().body(Map.of("error", "A task with this name already exists in this project."));
        }

        Task task = new Task();
        task.setName(name);
        task.setProjectId(projectId);
        task.setStatus(TaskStatus.fromString(body.getStatus() != null ? body.getStatus() : "todo"));
        task.setPriority(body.getPriority() != null ? body.getPriority() : "medium");
        task.setDueDate(body.getDueDate());

        String assigneeId = body.getAssigneeId();
        if (assigneeId != null) {
            User assignee = userRepository.findById(assigneeId).orElse(null);
            task.setAssignee(assignee);
        }

        Task saved = taskRepository.save(task);
        activityService.log(user, "created task", saved.getName());
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<?> complete(@PathVariable @NonNull String id, @AuthenticationPrincipal User user) {
        return taskRepository.findById(id)
                .map(task -> {
                    task.setStatus(TaskStatus.COMPLETED);
                    Task saved = taskRepository.save(task);
                    activityService.log(user, "completed task", saved.getName());
                    return ResponseEntity.<Object>ok(saved);
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Task not found", "id", id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable @NonNull String id, @Valid @RequestBody TaskUpdateRequest body,
                                    @AuthenticationPrincipal User user) {
        return taskRepository.findById(id)
                .map(existing -> {
                    TaskStatus oldStatus = existing.getStatus();
                    if (body.getName() != null) {
                        String trimmedName = body.getName().trim();
                        if (trimmedName.isEmpty()) {
                            return ResponseEntity.badRequest().body(Map.of("error", "Task name is required."));
                        }
                        String projectId = existing.getProjectId();
                        boolean duplicateName = projectId != null
                                && taskRepository.existsByProjectIdAndNameIgnoreCase(projectId, trimmedName)
                                && !trimmedName.equalsIgnoreCase(existing.getName());
                        if (duplicateName) {
                            return ResponseEntity.badRequest().body(Map.of("error", "A task with this name already exists in this project."));
                        }
                        existing.setName(trimmedName);
                    }
                    if (body.getStatus() != null) existing.setStatus(TaskStatus.fromString(body.getStatus()));
                    if (body.getPriority() != null) existing.setPriority(body.getPriority());
                    if (body.getDueDate() != null) existing.setDueDate(body.getDueDate());
                    String assigneeId = body.getAssigneeId();
                    if (assigneeId != null) {
                        userRepository.findById(assigneeId).ifPresent(existing::setAssignee);
                    }
                    Task saved = taskRepository.save(existing);
                    String action = oldStatus != saved.getStatus()
                            ? "updated task status"
                            : "updated task";
                    activityService.log(user, action, saved.getName());
                    return ResponseEntity.<Object>ok(saved);
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Task not found", "id", id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable @NonNull String id, @AuthenticationPrincipal User user) {
        Task existing = taskRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Task not found", "id", id));
        }
        taskRepository.deleteById(id);
        activityService.log(user, "deleted task", existing.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{taskId}/reports")
    public ResponseEntity<List<TaskProgressReport>> getReports(@PathVariable @NonNull String taskId,
                                                               @AuthenticationPrincipal User user) {
        if (!taskRepository.existsById(taskId)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(reportRepository.findByTaskIdOrderByReportDateDescCreatedAtDesc(taskId));
    }

    @PostMapping("/{taskId}/reports")
    public ResponseEntity<?> addReport(@PathVariable @NonNull String taskId,
                                       @Valid @RequestBody TaskReportCreateRequest body,
                                       @AuthenticationPrincipal User user) {
        Task task = taskRepository.findById(taskId).orElse(null);
        if (task == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Task not found", "id", taskId));
        }
        boolean isAssignee = task.getAssignee() != null && user.getId().equals(task.getAssignee().getId());
        boolean isAdmin = user.getRole() == User.UserRole.ADMIN;
        if (!isAssignee && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only the task assignee or an admin can add progress reports."));
        }
        String content = body.getContent().trim();
        String reportDate = java.time.LocalDate.now().toString();
        if (body.getReportDate() != null) {
            String raw = body.getReportDate();
            if (raw.length() >= 10) reportDate = raw.substring(0, 10);
        }
        TaskProgressReport report = new TaskProgressReport();
        report.setTaskId(taskId);
        report.setUser(user);
        report.setContent(content);
        report.setReportDate(reportDate);
        TaskProgressReport saved = reportRepository.save(report);
        activityService.log(user, "reported progress on", task.getName());
        return ResponseEntity.ok(saved);
    }
}
