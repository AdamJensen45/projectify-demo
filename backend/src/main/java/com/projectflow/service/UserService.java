package com.projectflow.service;

import com.projectflow.model.User;
import com.projectflow.model.Project;
import com.projectflow.model.Task;
import com.projectflow.model.TaskProgressReport;
import com.projectflow.repository.ProjectMembershipRepository;
import com.projectflow.repository.ProjectRepository;
import com.projectflow.repository.TaskProgressReportRepository;
import com.projectflow.repository.TaskRepository;
import com.projectflow.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.lang.NonNull;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TaskProgressReportRepository taskProgressReportRepository;
    private final ProjectMembershipRepository projectMembershipRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            ProjectRepository projectRepository,
            TaskRepository taskRepository,
            TaskProgressReportRepository taskProgressReportRepository,
            ProjectMembershipRepository projectMembershipRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.taskProgressReportRepository = taskProgressReportRepository;
        this.projectMembershipRepository = projectMembershipRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User create(String name, String email, String password, User.UserRole role) {
        String normalizedName = normalizeRequired(name, "Name");
        String normalizedEmail = normalizeRequired(email, "Email").toLowerCase(Locale.ROOT);
        String normalizedPassword = normalizeRequired(password, "Password");

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new RuntimeException("Email already registered");
        }
        User user = new User(
                normalizedName,
                normalizedEmail,
                passwordEncoder.encode(normalizedPassword),
                role != null ? role : User.UserRole.MEMBER
        );
        return userRepository.save(user);
    }

    public List<Map<String, Object>> getAllResponses() {
        return userRepository.findAll().stream()
                .map(UserService::toResponse)
                .toList();
    }

    public Page<Map<String, Object>> getAllResponsesPaginated(String search, User.UserRole role, Pageable pageable) {
        Page<User> userPage = userRepository.findAllWithFilters(
                (search != null && !search.isBlank()) ? search.trim() : null,
                role,
                pageable
        );
        List<Map<String, Object>> content = userPage.getContent().stream()
                .map(UserService::toResponse)
                .toList();
        return new PageImpl<>(content, pageable, userPage.getTotalElements());
    }

    @Transactional
    public User update(@NonNull String id, String name, String email, String password, User.UserRole role) {
        User existing = Objects.requireNonNull(
                userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"))
        );


        if (name != null) {
            existing.setName(normalizeRequired(name, "Name"));
            existing.setAvatar(buildAvatar(existing.getName()));
        }

        if (email != null) {
            String normalizedEmail = normalizeRequired(email, "Email").toLowerCase(Locale.ROOT);
            if (userRepository.existsByEmailIgnoreCaseAndIdNot(normalizedEmail, id)) {
                throw new RuntimeException("Email already registered");
            }
            existing.setEmail(normalizedEmail);
        }

        if (password != null) {
            String normalizedPassword = normalizeRequired(password, "Password");
            existing.setPassword(passwordEncoder.encode(normalizedPassword));
        }

        if (role != null) {
            if (existing.getRole() == User.UserRole.ADMIN
                    && role != User.UserRole.ADMIN
                    && userRepository.countByRole(User.UserRole.ADMIN) <= 1) {
                throw new RuntimeException("At least one admin account must remain.");
            }
            existing.setRole(role);
        }

        return Objects.requireNonNull(userRepository.save(existing));
    }

    @Transactional
    public void delete(@NonNull String id, User currentUser) {
        User existing = Objects.requireNonNull(
                userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"))
        );


        if (currentUser != null && existing.getId().equals(currentUser.getId())) {
            throw new RuntimeException("You cannot delete your own account.");
        }

        if (existing.getRole() == User.UserRole.ADMIN && userRepository.countByRole(User.UserRole.ADMIN) <= 1) {
            throw new RuntimeException("At least one admin account must remain.");
        }

        List<Task> assignedTasks = taskRepository.findByAssigneeIdWithAssignee(id);
        if (!assignedTasks.isEmpty()) {
            for (Task task : assignedTasks) {
                task.setAssignee(null);
            }
            taskRepository.saveAll(assignedTasks);
        }

        List<Project> createdProjects = Objects.requireNonNull(projectRepository.findByCreatedBy_Id(id));
        for (Project project : createdProjects) {
            project.setCreatedBy(null);
        }
        projectRepository.saveAll(createdProjects);

        List<TaskProgressReport> reports = Objects.requireNonNull(
                taskProgressReportRepository.findByUserIdOrderByReportDateDescCreatedAtDesc(id)
        );
        taskProgressReportRepository.deleteAll(reports);

        var memberships = Objects.requireNonNull(projectMembershipRepository.findByUserId(id));
        projectMembershipRepository.deleteAll(memberships);

        userRepository.delete(existing);
    }

    @Transactional
    public void changePassword(String userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String current = normalizeRequired(currentPassword, "Current password");
        String newPwd = normalizeRequired(newPassword, "New password");

        if (!passwordEncoder.matches(current, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        if (newPwd.length() < 6) {
            throw new RuntimeException("New password must be at least 6 characters");
        }
        if (passwordEncoder.matches(newPwd, user.getPassword())) {
            throw new RuntimeException("New password must be different from current password");
        }

        user.setPassword(passwordEncoder.encode(newPwd));
        userRepository.save(user);
    }

    public static User.UserRole parseRole(String role) {
        return "admin".equalsIgnoreCase(role != null ? role.trim() : "")
                ? User.UserRole.ADMIN
                : User.UserRole.MEMBER;
    }

    private static String normalizeRequired(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new RuntimeException(fieldName + " is required");
        }
        return value.trim();
    }

    private static String buildAvatar(String name) {
        return name.chars()
                .mapToObj(c -> String.valueOf((char) c))
                .filter(s -> s.equals(s.toUpperCase()) && !s.equals(" "))
                .reduce("", String::concat);
    }

    public static Map<String, Object> toResponse(User u) {
        return Map.of(
                "id", u.getId(),
                "name", u.getName(),
                "email", u.getEmail(),
                "role", u.getRole().name().toLowerCase(),
                "avatar", u.getAvatar() != null ? u.getAvatar() : "",
                "createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : ""
        );
    }
}
