package com.projectflow.config;

import com.projectflow.model.Activity;
import com.projectflow.model.Project;
import com.projectflow.model.ProjectMembership;
import com.projectflow.model.Task;
import com.projectflow.model.TaskStatus;
import com.projectflow.model.User;
import com.projectflow.repository.ActivityRepository;
import com.projectflow.repository.ProjectMembershipRepository;
import com.projectflow.repository.ProjectRepository;
import com.projectflow.repository.TaskRepository;
import com.projectflow.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMembershipRepository projectMembershipRepository;
    private final TaskRepository taskRepository;
    private final ActivityRepository activityRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository,
                      ProjectRepository projectRepository,
                      ProjectMembershipRepository projectMembershipRepository,
                      TaskRepository taskRepository,
                      ActivityRepository activityRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.projectMembershipRepository = projectMembershipRepository;
        this.taskRepository = taskRepository;
        this.activityRepository = activityRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Ensure admin@projectflow.com always has ADMIN role (fixes existing DBs or mis-seeded data)
        Optional<User> existingAdmin = userRepository.findByEmail("admin@projectflow.com");
        if (existingAdmin.isPresent() && existingAdmin.get().getRole() != User.UserRole.ADMIN) {
            User u = existingAdmin.get();
            u.setRole(User.UserRole.ADMIN);
            userRepository.save(u);
        }

        User admin;
        User sarah;
        User james;

        if (userRepository.count() == 0) {
            // --- Users ---
            admin = new User("admin", "admin@projectflow.com",
                    passwordEncoder.encode("admin123"), User.UserRole.ADMIN);
            admin.setAvatar("AU");
            admin = userRepository.save(admin);

            sarah = new User("Sarah Chen", "sarah@projectflow.com",
                    passwordEncoder.encode("sarah123"), User.UserRole.MEMBER);
            sarah.setAvatar("SC");
            sarah = userRepository.save(sarah);

            james = new User("James Wilson", "james@projectflow.com",
                    passwordEncoder.encode("james123"), User.UserRole.MEMBER);
            james.setAvatar("JW");
            james = userRepository.save(james);
        } else {
            admin = userRepository.findByEmail("admin@projectflow.com").orElseThrow(
                    () -> new IllegalStateException("admin@projectflow.com must exist when users exist"));
            sarah = userRepository.findByEmail("sarah@projectflow.com").orElse(admin);
            james = userRepository.findByEmail("james@projectflow.com").orElse(admin);
        }

        if (projectRepository.count() > 0) return;

        // --- Projects ---
        Project p1 = new Project();
        p1.setName("Website Redesign");
        p1.setDescription("Complete overhaul of the company website with modern UI/UX");
        p1.setStatus("active");
        p1.setProgress(68);
        p1.setStartDate("2026-01-15");
        p1.setEndDate("2026-04-30");
        p1.setCreatedBy(admin);
        p1 = projectRepository.save(p1);

        Project p2 = new Project();
        p2.setName("Mobile App v2");
        p2.setDescription("Second major release of the mobile app with offline support");
        p2.setStatus("active");
        p2.setProgress(42);
        p2.setStartDate("2026-02-01");
        p2.setEndDate("2026-06-15");
        p2.setCreatedBy(admin);
        p2 = projectRepository.save(p2);

        Project p3 = new Project();
        p3.setName("API Migration");
        p3.setDescription("Migrate legacy REST endpoints to GraphQL");
        p3.setStatus("planning");
        p3.setProgress(12);
        p3.setStartDate("2026-03-01");
        p3.setEndDate("2026-07-31");
        p3.setCreatedBy(admin);
        p3 = projectRepository.save(p3);

        Project p4 = new Project();
        p4.setName("Design System");
        p4.setDescription("Unified component library and brand guidelines");
        p4.setStatus("completed");
        p4.setProgress(100);
        p4.setStartDate("2025-10-01");
        p4.setEndDate("2026-01-31");
        p4.setCreatedBy(admin);
        p4 = projectRepository.save(p4);

        Project p5 = new Project();
        p5.setName("Analytics Dashboard");
        p5.setDescription("Real-time business analytics and reporting platform");
        p5.setStatus("on-hold");
        p5.setProgress(35);
        p5.setStartDate("2026-01-20");
        p5.setEndDate("2026-05-20");
        p5.setCreatedBy(admin);
        p5 = projectRepository.save(p5);

        // --- Project memberships: admin sees all; Sarah in p1,p2,p4; James in p1,p2,p3,p5 ---
        projectMembershipRepository.save(new ProjectMembership(admin.getId(), p1.getId()));
        projectMembershipRepository.save(new ProjectMembership(admin.getId(), p2.getId()));
        projectMembershipRepository.save(new ProjectMembership(admin.getId(), p3.getId()));
        projectMembershipRepository.save(new ProjectMembership(admin.getId(), p4.getId()));
        projectMembershipRepository.save(new ProjectMembership(admin.getId(), p5.getId()));
        projectMembershipRepository.save(new ProjectMembership(sarah.getId(), p1.getId()));
        projectMembershipRepository.save(new ProjectMembership(sarah.getId(), p2.getId()));
        projectMembershipRepository.save(new ProjectMembership(sarah.getId(), p4.getId()));
        projectMembershipRepository.save(new ProjectMembership(james.getId(), p1.getId()));
        projectMembershipRepository.save(new ProjectMembership(james.getId(), p2.getId()));
        projectMembershipRepository.save(new ProjectMembership(james.getId(), p3.getId()));
        projectMembershipRepository.save(new ProjectMembership(james.getId(), p5.getId()));

        // --- Tasks (Website Redesign) ---
        Task t1 = new Task();
        t1.setName("Design homepage hero section");
        t1.setProjectId(p1.getId());
        t1.setAssignee(sarah);
        t1.setStatus(TaskStatus.COMPLETED);
        t1.setPriority("high");
        t1.setDueDate("2026-02-20");
        taskRepository.save(t1);

        Task t2 = new Task();
        t2.setName("Implement responsive navigation");
        t2.setProjectId(p1.getId());
        t2.setAssignee(james);
        t2.setStatus(TaskStatus.IN_PROGRESS);
        t2.setPriority("high");
        t2.setDueDate("2026-03-15");
        taskRepository.save(t2);

        Task t3 = new Task();
        t3.setName("Write content for About page");
        t3.setProjectId(p1.getId());
        t3.setAssignee(admin);
        t3.setStatus(TaskStatus.TODO);
        t3.setPriority("medium");
        t3.setDueDate("2026-03-28");
        taskRepository.save(t3);

        // --- Tasks (Mobile App v2) ---
        Task t4 = new Task();
        t4.setName("Set up offline data sync");
        t4.setProjectId(p2.getId());
        t4.setAssignee(james);
        t4.setStatus(TaskStatus.IN_PROGRESS);
        t4.setPriority("urgent");
        t4.setDueDate("2026-03-20");
        taskRepository.save(t4);

        Task t5 = new Task();
        t5.setName("Implement push notifications");
        t5.setProjectId(p2.getId());
        t5.setAssignee(sarah);
        t5.setStatus(TaskStatus.TODO);
        t5.setPriority("high");
        t5.setDueDate("2026-04-10");
        taskRepository.save(t5);

        Task t6 = new Task();
        t6.setName("User testing for checkout flow");
        t6.setProjectId(p2.getId());
        t6.setAssignee(admin);
        t6.setStatus(TaskStatus.IN_PROGRESS);
        t6.setPriority("medium");
        t6.setDueDate("2026-03-25");
        taskRepository.save(t6);

        // --- Tasks (API Migration) ---
        Task t7 = new Task();
        t7.setName("Define GraphQL schema");
        t7.setProjectId(p3.getId());
        t7.setAssignee(james);
        t7.setStatus(TaskStatus.IN_PROGRESS);
        t7.setPriority("high");
        t7.setDueDate("2026-03-30");
        taskRepository.save(t7);

        Task t8 = new Task();
        t8.setName("Implement SSO with Okta");
        t8.setProjectId(p3.getId());
        t8.setAssignee(sarah);
        t8.setStatus(TaskStatus.IN_PROGRESS);
        t8.setPriority("urgent");
        t8.setDueDate("2026-04-05");
        taskRepository.save(t8);

        // --- Tasks (Analytics Dashboard) ---
        Task t9 = new Task();
        t9.setName("Design KPI widgets");
        t9.setProjectId(p5.getId());
        t9.setAssignee(sarah);
        t9.setStatus(TaskStatus.TODO);
        t9.setPriority("medium");
        t9.setDueDate("2026-04-15");
        taskRepository.save(t9);

        Task t10 = new Task();
        t10.setName("Set up chart data pipeline");
        t10.setProjectId(p5.getId());
        t10.setAssignee(james);
        t10.setStatus(TaskStatus.TODO);
        t10.setPriority("low");
        t10.setDueDate("2026-04-30");
        taskRepository.save(t10);

        // --- Activities ---
        activityRepository.save(new Activity(sarah.getId(), "Sarah Chen", "completed",
                "Design homepage hero section", "2026-03-13T09:30:00"));
        activityRepository.save(new Activity(sarah.getId(), "Sarah Chen", "submitted for review",
                "Implement SSO with Okta", "2026-03-13T08:45:00"));
        activityRepository.save(new Activity(james.getId(), "James Wilson", "started working on",
                "Set up offline data sync", "2026-03-12T16:20:00"));
        activityRepository.save(new Activity(admin.getId(), "admin", "created project",
                "API Migration", "2026-03-12T14:00:00"));
        activityRepository.save(new Activity(james.getId(), "James Wilson", "commented on",
                "Implement responsive navigation", "2026-03-12T11:30:00"));
        activityRepository.save(new Activity(admin.getId(), "admin", "assigned",
                "User testing for checkout flow", "2026-03-11T15:45:00"));
        activityRepository.save(new Activity(sarah.getId(), "Sarah Chen", "uploaded designs for",
                "Design System", "2026-03-11T10:15:00"));
        activityRepository.save(new Activity(james.getId(), "James Wilson", "updated priority of",
                "Define GraphQL schema", "2026-03-10T13:30:00"));
    }
}
