package com.projectflow.model;

import jakarta.persistence.*;

@Entity
@Table(name = "activities")
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "username", nullable = false)
    private String user;

    @Column(nullable = false)
    private String action;

    @Column(nullable = false)
    private String target;

    @Column(nullable = false)
    private String timestamp;

    public Activity() {}

    public Activity(String user, String action, String target, String timestamp) {
        this.userId = null;
        this.user = user;
        this.action = action;
        this.target = target;
        this.timestamp = timestamp;
    }

    public Activity(String userId, String user, String action, String target, String timestamp) {
        this.userId = userId;
        this.user = user;
        this.action = action;
        this.target = target;
        this.timestamp = timestamp;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getUser() { return user; }
    public void setUser(String user) { this.user = user; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getTarget() { return target; }
    public void setTarget(String target) { this.target = target; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}
