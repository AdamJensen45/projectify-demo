package com.projectflow.service;

import com.projectflow.model.Task;
import com.projectflow.model.User;
import com.projectflow.repository.ProjectMembershipRepository;
import com.projectflow.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
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
            return taskRepository.findByAssignee_Id(assigneeFilter);
        }
        if (currentUser.getRole() == User.UserRole.ADMIN) {
            return taskRepository.findAll();
        }
        // Members only see tasks assigned to them (in projects they belong to)
        Set<String> projectIds = projectMembershipRepository.findByUserId(currentUser.getId()).stream()
                .map(pm -> pm.getProjectId())
                .collect(Collectors.toSet());
        if (projectIds.isEmpty()) return List.of();
        List<Task> inProjects = taskRepository.findAll().stream()
                .filter(t -> t.getProjectId() != null && projectIds.contains(t.getProjectId()))
                .toList();
        String myId = currentUser.getId();
        return inProjects.stream()
                .filter(t -> t.getAssignee() != null && myId.equals(t.getAssignee().getId()))
                .toList();
    }
}
