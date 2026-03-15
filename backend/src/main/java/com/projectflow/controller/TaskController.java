package com.projectflow.controller;

import com.projectflow.model.Task;
import com.projectflow.model.TaskProgressReport;
import com.projectflow.model.TaskStatus;
import com.projectflow.model.User;
import com.projectflow.repository.TaskProgressReportRepository;
import com.projectflow.repository.TaskRepository;
import com.projectflow.repository.UserRepository;
import com.projectflow.service.ActivityService;
import com.projectflow.service.TaskService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body, @AuthenticationPrincipal User user) {
        String name = (String) body.get("name");
        String projectId = (String) body.get("projectId");
        if (name != null && projectId != null && taskRepository.existsByProjectIdAndNameIgnoreCase(projectId, name.trim())) {
            return ResponseEntity.badRequest().body(Map.of("error", "A task with this name already exists in this project."));
        }

        Task task = new Task();
        task.setName(name != null ? name.trim() : null);
        task.setProjectId(projectId);
        task.setStatus(TaskStatus.fromString(body.getOrDefault("status", "todo").toString()));
        task.setPriority(body.getOrDefault("priority", "medium").toString());
        task.setDueDate((String) body.get("dueDate"));

        String assigneeId = (String) body.get("assigneeId");
        if (assigneeId != null) {
            User assignee = userRepository.findById(assigneeId).orElse(null);
            task.setAssignee(assignee);
        }

        Task saved = taskRepository.save(task);
        activityService.log(user, "created task", saved.getName());
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<?> complete(@PathVariable String id, @AuthenticationPrincipal User user) {
        return taskRepository.findById(id)
                .map(task -> {
                    task.setStatus(TaskStatus.COMPLETED);
                    Task saved = taskRepository.save(task);
                    activityService.log(user, "completed task", saved.getName());
                    return ResponseEntity.<Object>ok(saved);
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Task not found", "id", id != null ? id : "")));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody Map<String, Object> body,
                                    @AuthenticationPrincipal User user) {
        return taskRepository.findById(id)
                .map(existing -> {
                    TaskStatus oldStatus = existing.getStatus();
                    if (body.containsKey("name")) existing.setName((String) body.get("name"));
                    if (body.containsKey("status")) existing.setStatus(TaskStatus.fromString(body.get("status").toString()));
                    if (body.containsKey("priority")) existing.setPriority((String) body.get("priority"));
                    if (body.containsKey("dueDate")) existing.setDueDate((String) body.get("dueDate"));
                    if (body.containsKey("assigneeId")) {
                        String assigneeId = (String) body.get("assigneeId");
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
                        .body(Map.of("error", "Task not found", "id", id != null ? id : "")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id, @AuthenticationPrincipal User user) {
        Task existing = taskRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Task not found", "id", id != null ? id : ""));
        }
        taskRepository.deleteById(id);
        activityService.log(user, "deleted task", existing.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{taskId}/reports")
    public ResponseEntity<List<TaskProgressReport>> getReports(@PathVariable String taskId,
                                                               @AuthenticationPrincipal User user) {
        if (!taskRepository.existsById(taskId)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(reportRepository.findByTaskIdOrderByReportDateDescCreatedAtDesc(taskId));
    }

    @PostMapping("/{taskId}/reports")
    public ResponseEntity<?> addReport(@PathVariable String taskId,
                                       @RequestBody Map<String, Object> body,
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
        String content = body != null && body.get("content") != null ? body.get("content").toString().trim() : null;
        if (content == null || content.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Report content is required."));
        }
        if (content.length() > 2000) {
            return ResponseEntity.badRequest().body(Map.of("error", "Report content must be at most 2000 characters."));
        }
        String reportDate = java.time.LocalDate.now().toString();
        if (body != null && body.get("reportDate") != null) {
            String raw = body.get("reportDate").toString();
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
