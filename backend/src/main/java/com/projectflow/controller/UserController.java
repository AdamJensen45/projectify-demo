package com.projectflow.controller;

import com.projectflow.model.User;
import com.projectflow.repository.UserRepository;
import com.projectflow.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;

    public UserController(UserRepository userRepository, UserService userService) {
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @GetMapping
    public List<Map<String, Object>> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserService::toResponse)
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> body) {
        try {
            String name = body.get("name");
            String email = body.get("email");
            String password = body.get("password");
            String roleStr = body.get("role");
            User.UserRole role = "admin".equalsIgnoreCase(roleStr != null ? roleStr : "") ? User.UserRole.ADMIN : User.UserRole.MEMBER;
            User user = userService.create(name, email, password, role);
            return ResponseEntity.status(HttpStatus.CREATED).body(UserService.toResponse(user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> currentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        return ResponseEntity.ok(UserService.toResponse(user));
    }
}
