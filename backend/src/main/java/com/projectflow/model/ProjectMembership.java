package com.projectflow.model;

import jakarta.persistence.*;

@Entity
@Table(name = "project_memberships", uniqueConstraints = {
    @UniqueConstraint(columnNames = { "user_id", "project_id" })
})
public class ProjectMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "project_id", nullable = false)
    private String projectId;

    public ProjectMembership() {}

    public ProjectMembership(String userId, String projectId) {
        this.userId = userId;
        this.projectId = projectId;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
}
