package com.projectflow.service;

import com.projectflow.model.Project;
import com.projectflow.model.ProjectMembership;
import com.projectflow.model.Task;
import com.projectflow.model.TaskStatus;
import com.projectflow.model.User;
import com.projectflow.repository.ProjectMembershipRepository;
import com.projectflow.repository.ProjectRepository;
import com.projectflow.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMembershipRepository projectMembershipRepository;
    private final TaskRepository taskRepository;
    private final ActivityService activityService;

    public ProjectService(ProjectRepository projectRepository,
                          ProjectMembershipRepository projectMembershipRepository,
                          TaskRepository taskRepository,
                          ActivityService activityService) {
        this.projectRepository = projectRepository;
        this.projectMembershipRepository = projectMembershipRepository;
        this.taskRepository = taskRepository;
        this.activityService = activityService;
    }

    public List<Project> getAll(User currentUser) {
        List<Project> projects;
        if (currentUser.getRole() == User.UserRole.ADMIN) {
            projects = projectRepository.findAll();
        } else {
            List<String> projectIds = projectMembershipRepository.findByUserId(currentUser.getId()).stream()
                    .map(ProjectMembership::getProjectId)
                    .distinct()
                    .toList();
            projects = projectIds.isEmpty() ? List.of() : projectRepository.findByIdIn(projectIds);
        }
        return projects.stream().map(this::withTeam).toList();
    }

    public Project getById(String id, User currentUser) {
        Project project = projectRepository.findById(id).orElse(null);
        if (project == null) return null;
        if (currentUser.getRole() != User.UserRole.ADMIN) {
            boolean hasAccess = projectMembershipRepository.existsByUserIdAndProjectId(currentUser.getId(), id);
            if (!hasAccess) throw new ForbiddenException("Access denied to this project");
        }
        return withTeam(project);
    }

    public Project create(Project project, User createdBy) {
        if (project.getName() != null && projectRepository.existsByNameIgnoreCase(project.getName().trim())) {
            throw new RuntimeException("A project with this name already exists.");
        }
        project.setCreatedBy(createdBy);
        Project saved = projectRepository.save(project);
        projectMembershipRepository.save(new ProjectMembership(createdBy.getId(), saved.getId()));
        activityService.log(createdBy, "created project", saved.getName());
        return withTeam(saved);
    }

    public Project update(String id, Project updates, User actor) {
        Project existing = projectRepository.findById(id).orElse(null);
        if (existing == null) return null;
        if (updates.getName() != null) {
            String trimmed = updates.getName().trim();
            if (!trimmed.equals(existing.getName()) && projectRepository.existsByNameIgnoreCaseAndIdNot(trimmed, id)) {
                throw new RuntimeException("A project with this name already exists.");
            }
            existing.setName(trimmed);
        }
        if (updates.getDescription() != null) existing.setDescription(updates.getDescription());
        if (updates.getStatus() != null) existing.setStatus(updates.getStatus());
        existing.setProgress(updates.getProgress());
        if (updates.getStartDate() != null) existing.setStartDate(updates.getStartDate());
        if (updates.getEndDate() != null) existing.setEndDate(updates.getEndDate());
        Project saved = projectRepository.save(existing);
        activityService.log(actor, "updated project", saved.getName());
        return withTeam(saved);
    }

    public boolean delete(String id, User actor) {
        Project existing = projectRepository.findById(id).orElse(null);
        if (existing == null) return false;
        projectRepository.deleteById(id);
        activityService.log(actor, "deleted project", existing.getName());
        return true;
    }

    public List<Task> getTasks(String projectId, User currentUser) {
        getById(projectId, currentUser);
        return taskRepository.findByProjectId(projectId);
    }

    private Project withTeam(Project project) {
        List<Task> tasks = taskRepository.findByProjectId(project.getId());
        List<Map<String, String>> team = tasks.stream()
                .map(Task::getAssignee)
                .filter(u -> u != null)
                .collect(Collectors.collectingAndThen(
                        Collectors.toMap(User::getId, u -> u, (a, b) -> a),
                        map -> map.values().stream()
                                .map(u -> {
                                    Map<String, String> m = new LinkedHashMap<>();
                                    m.put("id", u.getId());
                                    m.put("name", u.getName());
                                    m.put("avatar", u.getAvatar() != null ? u.getAvatar() : "");
                                    m.put("role", u.getRole() == User.UserRole.ADMIN ? "Admin" : "Member");
                                    return m;
                                })
                                .collect(Collectors.toList())
                ));
        project.setTeam(team);
        int total = tasks.size();
        if (total > 0) {
            long completed = tasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count();
            project.setProgress((int) Math.round(100.0 * completed / total));
        } else {
            project.setProgress(0);
        }
        return project;
    }

    public static class ForbiddenException extends RuntimeException {
        public ForbiddenException(String message) {
            super(message);
        }
    }
}
