package com.projectflow.controller;

import com.projectflow.model.Project;
import com.projectflow.model.Task;
import com.projectflow.model.User;
import com.projectflow.service.ProjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public List<Project> getAll(@AuthenticationPrincipal User user) {
        return projectService.getAll(user);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getById(@PathVariable String id, @AuthenticationPrincipal User user) {
        try {
            Project project = projectService.getById(id, user);
            return project != null ? ResponseEntity.ok(project) : ResponseEntity.notFound().build();
        } catch (ProjectService.ForbiddenException e) {
            return ResponseEntity.status(403).build();
        }
    }

    @GetMapping("/{id}/tasks")
    public ResponseEntity<List<Task>> getTasks(@PathVariable String id, @AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(projectService.getTasks(id, user));
        } catch (ProjectService.ForbiddenException e) {
            return ResponseEntity.status(403).build();
        }
    }

    @PostMapping
    public Project create(@RequestBody Project project, @AuthenticationPrincipal User user) {
        return projectService.create(project, user);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Project> update(@PathVariable String id, @RequestBody Project updates,
                                          @AuthenticationPrincipal User user) {
        Project updated = projectService.update(id, updates, user);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, @AuthenticationPrincipal User user) {
        return projectService.delete(id, user) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
