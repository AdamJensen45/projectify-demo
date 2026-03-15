package com.projectflow.service;

import com.projectflow.model.Task;
import com.projectflow.model.User;
import com.projectflow.repository.ProjectMembershipRepository;
import com.projectflow.repository.TaskRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectMembershipRepository projectMembershipRepository;

    public TaskService(TaskRepository taskRepository, ProjectMembershipRepository projectMembershipRepository) {
        this.taskRepository = taskRepository;
        this.projectMembershipRepository = projectMembershipRepository;
    }

    public List<Task> getAll(User currentUser, String assigneeFilter) {
        if (assigneeFilter != null) {
            return taskRepository.findByAssigneeIdWithAssignee(assigneeFilter);
        }
        if (currentUser.getRole() == User.UserRole.ADMIN) {
            return taskRepository.findAllWithAssignee();
        }
        List<String> projectIds = projectMembershipRepository.findByUserId(currentUser.getId()).stream()
                .map(pm -> pm.getProjectId())
                .distinct()
                .collect(Collectors.toList());
        if (projectIds.isEmpty()) return List.of();
        return taskRepository.findByProjectIdInAndAssigneeId(projectIds, currentUser.getId());
    }

    public Page<Task> getAllPaginated(User currentUser, String assigneeFilter, String search, String status, String priority, Pageable pageable) {
        String s = emptyToNull(search);
        String st = emptyToNull(status);
        String p = emptyToNull(priority);

        if (assigneeFilter != null) {
            return taskRepository.findByAssigneeIdWithFilters(assigneeFilter, s, st, p, pageable);
        }
        if (currentUser.getRole() == User.UserRole.ADMIN) {
            return taskRepository.findAllWithFilters(s, st, p, pageable);
        }
        List<String> projectIds = projectMembershipRepository.findByUserId(currentUser.getId()).stream()
                .map(pm -> pm.getProjectId())
                .distinct()
                .collect(Collectors.toList());
        if (projectIds.isEmpty()) return new PageImpl<>(Collections.emptyList(), pageable, 0);
        return taskRepository.findByProjectIdInAndAssigneeIdWithFilters(projectIds, currentUser.getId(), s, st, p, pageable);
    }

    private static String emptyToNull(String v) {
        return (v == null || v.isBlank()) ? null : v.trim();
    }
}
