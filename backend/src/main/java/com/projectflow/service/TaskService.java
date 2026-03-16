package com.projectflow.service;

import com.projectflow.dto.task.TaskCreateRequest;
import com.projectflow.dto.task.TaskReportCreateRequest;
import com.projectflow.dto.task.TaskUpdateRequest;
import com.projectflow.exception.ApiConflictException;
import com.projectflow.exception.ApiForbiddenException;
import com.projectflow.exception.ApiNotFoundException;
import com.projectflow.model.Task;
import com.projectflow.model.TaskProgressReport;
import com.projectflow.model.TaskStatus;
import com.projectflow.model.User;
import com.projectflow.repository.ProjectMembershipRepository;
import com.projectflow.repository.ProjectRepository;
import com.projectflow.repository.TaskProgressReportRepository;
import com.projectflow.repository.TaskRepository;
import com.projectflow.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectMembershipRepository projectMembershipRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskProgressReportRepository reportRepository;
    private final ActivityService activityService;

    public TaskService(TaskRepository taskRepository,
                       ProjectMembershipRepository projectMembershipRepository,
                       ProjectRepository projectRepository,
                       UserRepository userRepository,
                       TaskProgressReportRepository reportRepository,
                       ActivityService activityService) {
        this.taskRepository = taskRepository;
        this.projectMembershipRepository = projectMembershipRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.reportRepository = reportRepository;
        this.activityService = activityService;
    }

    public List<Task> getAll(User currentUser, String assigneeFilter) {
        if (assigneeFilter != null && !assigneeFilter.isBlank()) {
            return getAllForAssignee(currentUser, assigneeFilter.trim());
        }
        if (isAdmin(currentUser)) {
            return taskRepository.findAllWithAssignee();
        }
        List<String> projectIds = visibleProjectIds(currentUser);
        if (projectIds.isEmpty()) return List.of();
        return taskRepository.findByProjectIdInAndAssigneeId(projectIds, currentUser.getId());
    }

    public Page<Task> getAllPaginated(User currentUser, String assigneeFilter, String search, String status, String priority, Pageable pageable) {
        String s = emptyToNull(search);
        String st = emptyToNull(status);
        String p = emptyToNull(priority);

        if (assigneeFilter != null && !assigneeFilter.isBlank()) {
            return getAllPaginatedForAssignee(currentUser, assigneeFilter.trim(), s, st, p, pageable);
        }
        if (isAdmin(currentUser)) {
            return taskRepository.findAllWithFilters(s, st, p, pageable);
        }
        List<String> projectIds = visibleProjectIds(currentUser);
        if (projectIds.isEmpty()) return new PageImpl<>(Collections.emptyList(), pageable, 0);
        return taskRepository.findByProjectIdInAndAssigneeIdWithFilters(projectIds, currentUser.getId(), s, st, p, pageable);
    }

    public Task create(TaskCreateRequest body, User actor) {
        ensureAdmin(actor);
        String name = body.getName().trim();
        String projectId = body.getProjectId();

        if (!projectRepository.existsById(projectId)) {
            throw new ApiNotFoundException("Project not found");
        }
        if (taskRepository.existsByProjectIdAndNameIgnoreCase(projectId, name)) {
            throw new ApiConflictException("A task with this name already exists in this project.");
        }

        Task task = new Task();
        task.setName(name);
        task.setProjectId(projectId);
        task.setStatus(TaskStatus.fromString(body.getStatus() != null ? body.getStatus() : "todo"));
        task.setPriority(body.getPriority() != null ? body.getPriority() : "medium");
        task.setDueDate(body.getDueDate());

        String assigneeId = emptyToNull(body.getAssigneeId());
        if (assigneeId != null) {
            User assignee = userRepository.findById(assigneeId)
                    .orElseThrow(() -> new ApiNotFoundException("Assignee not found"));
            task.setAssignee(assignee);
        }

        Task saved = taskRepository.save(task);
        activityService.log(actor, "created task", saved.getName());
        return saved;
    }

    public Task complete(String id, User actor) {
        Task task = requireTask(id);
        ensureAdminOrAssignee(task, actor, "You can only complete your own assigned tasks.");
        task.setStatus(TaskStatus.COMPLETED);
        Task saved = taskRepository.save(task);
        activityService.log(actor, "completed task", saved.getName());
        return saved;
    }

    public Task update(String id, TaskUpdateRequest body, User actor) {
        Task existing = requireTask(id);
        ensureCanUpdate(existing, body, actor);
        TaskStatus oldStatus = existing.getStatus();

        if (body.getName() != null) {
            String trimmedName = body.getName().trim();
            if (trimmedName.isEmpty()) {
                throw new RuntimeException("Task name is required.");
            }
            String projectId = existing.getProjectId();
            boolean duplicateName = projectId != null
                    && taskRepository.existsByProjectIdAndNameIgnoreCase(projectId, trimmedName)
                    && !trimmedName.equalsIgnoreCase(existing.getName());
            if (duplicateName) {
                throw new ApiConflictException("A task with this name already exists in this project.");
            }
            existing.setName(trimmedName);
        }

        if (body.getStatus() != null) existing.setStatus(TaskStatus.fromString(body.getStatus()));
        if (body.getPriority() != null) existing.setPriority(body.getPriority());
        if (body.getDueDate() != null) existing.setDueDate(body.getDueDate());

        String assigneeId = emptyToNull(body.getAssigneeId());
        if (assigneeId != null) {
            User assignee = userRepository.findById(assigneeId)
                    .orElseThrow(() -> new ApiNotFoundException("Assignee not found"));
            existing.setAssignee(assignee);
        }

        Task saved = taskRepository.save(existing);
        String action = oldStatus != saved.getStatus()
                ? "updated task status"
                : "updated task";
        activityService.log(actor, action, saved.getName());
        return saved;
    }

    public void delete(String id, User actor) {
        ensureAdmin(actor);
        Task existing = requireTask(id);
        taskRepository.deleteById(id);
        activityService.log(actor, "deleted task", existing.getName());
    }

    public List<TaskProgressReport> getReports(String taskId, User actor) {
        Task task = requireTask(taskId);
        ensureCanViewReports(task, actor);
        return reportRepository.findByTaskIdOrderByReportDateDescCreatedAtDesc(taskId);
    }

    public TaskProgressReport addReport(String taskId, TaskReportCreateRequest body, User actor) {
        Task task = requireTask(taskId);
        ensureAdminOrAssignee(task, actor, "Only the task assignee or an admin can add progress reports.");

        String reportDate = LocalDate.now().toString();
        if (body.getReportDate() != null && body.getReportDate().length() >= 10) {
            reportDate = body.getReportDate().substring(0, 10);
        }

        TaskProgressReport report = new TaskProgressReport();
        report.setTaskId(taskId);
        report.setUser(actor);
        report.setContent(body.getContent().trim());
        report.setReportDate(reportDate);

        TaskProgressReport saved = reportRepository.save(report);
        activityService.log(actor, "reported progress on", task.getName());
        return saved;
    }

    private List<Task> getAllForAssignee(User currentUser, String assigneeFilter) {
        if (isAdmin(currentUser)) {
            return taskRepository.findByAssigneeIdWithAssignee(assigneeFilter);
        }
        if (!currentUser.getId().equals(assigneeFilter)) {
            throw new ApiForbiddenException("You can only view your own assigned tasks.");
        }
        List<String> projectIds = visibleProjectIds(currentUser);
        if (projectIds.isEmpty()) return List.of();
        return taskRepository.findByProjectIdInAndAssigneeId(projectIds, currentUser.getId());
    }

    private Page<Task> getAllPaginatedForAssignee(User currentUser, String assigneeFilter, String search, String status, String priority, Pageable pageable) {
        if (isAdmin(currentUser)) {
            return taskRepository.findByAssigneeIdWithFilters(assigneeFilter, search, status, priority, pageable);
        }
        if (!currentUser.getId().equals(assigneeFilter)) {
            throw new ApiForbiddenException("You can only view your own assigned tasks.");
        }
        List<String> projectIds = visibleProjectIds(currentUser);
        if (projectIds.isEmpty()) return new PageImpl<>(Collections.emptyList(), pageable, 0);
        return taskRepository.findByProjectIdInAndAssigneeIdWithFilters(projectIds, currentUser.getId(), search, status, priority, pageable);
    }

    private List<String> visibleProjectIds(User currentUser) {
        return projectMembershipRepository.findByUserId(currentUser.getId()).stream()
                .map(pm -> pm.getProjectId())
                .distinct()
                .toList();
    }

    private Task requireTask(String id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ApiNotFoundException("Task not found"));
    }

    private void ensureAdmin(User actor) {
        if (!isAdmin(actor)) {
            throw new ApiForbiddenException("Only admins can perform this action.");
        }
    }

    private void ensureAdminOrAssignee(Task task, User actor, String message) {
        if (isAdmin(actor)) return;
        if (task.getAssignee() != null && actor.getId().equals(task.getAssignee().getId())) return;
        throw new ApiForbiddenException(message);
    }

    private void ensureCanUpdate(Task task, TaskUpdateRequest body, User actor) {
        if (isAdmin(actor)) {
            return;
        }
        ensureAdminOrAssignee(task, actor, "You can only update your own assigned tasks.");
        boolean editsAdminOnly = body.getName() != null
                || body.getAssigneeId() != null
                || body.getPriority() != null
                || body.getDueDate() != null;
        if (editsAdminOnly) {
            throw new ApiForbiddenException("Only admins can edit task details; assignees may only update status.");
        }
    }

    private void ensureCanViewReports(Task task, User actor) {
        if (isAdmin(actor)) return;
        if (task.getAssignee() != null && actor.getId().equals(task.getAssignee().getId())) return;
        if (task.getProjectId() != null
                && projectMembershipRepository.existsByUserIdAndProjectId(actor.getId(), task.getProjectId())) {
            return;
        }
        throw new ApiForbiddenException("You do not have access to this task's progress reports.");
    }

    private boolean isAdmin(User currentUser) {
        return currentUser.getRole() == User.UserRole.ADMIN;
    }

    private static String emptyToNull(String v) {
        return (v == null || v.isBlank()) ? null : v.trim();
    }
}
