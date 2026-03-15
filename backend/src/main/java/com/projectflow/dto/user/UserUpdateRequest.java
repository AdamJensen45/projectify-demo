package com.projectflow.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public class UserUpdateRequest {

    @Size(min = 1, max = 100, message = "must be between 1 and 100 characters")
    private String name;

    @Email(message = "must be a valid email address")
    @Size(max = 255, message = "must be 255 characters or fewer")
    private String email;

    @Size(min = 6, max = 100, message = "must be between 6 and 100 characters")
    private String password;

    private String role;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
