package com.projectflow.controller;

import com.projectflow.dto.user.ChangePasswordRequest;
import com.projectflow.dto.user.UserCreateRequest;
import com.projectflow.dto.user.UserUpdateRequest;
import com.projectflow.model.User;
import com.projectflow.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public Object getAllUsers(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role) {
        User.UserRole roleEnum = (role != null && !role.isBlank()) ? UserService.parseRole(role.trim()) : null;
        if (page != null && size != null) {
            Pageable pageable = PageRequest.of(page, size);
            return userService.getAllResponsesPaginated(search, roleEnum, pageable);
        }
        return userService.getAllResponses();
    }

    @PostMapping
    public ResponseEntity<?> createUser(@Valid @RequestBody UserCreateRequest body) {
        User user = userService.create(
                body.getName(),
                body.getEmail(),
                body.getPassword(),
                UserService.parseRole(body.getRole())
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(UserService.toResponse(user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @Valid @RequestBody UserUpdateRequest body) {
        User updated = userService.update(
                id,
                body.getName(),
                body.getEmail(),
                body.getPassword(),
                body.getRole() != null ? UserService.parseRole(body.getRole()) : null
        );
        return ResponseEntity.ok(UserService.toResponse(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id, @AuthenticationPrincipal User user) {
        userService.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<?> currentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        return ResponseEntity.ok(UserService.toResponse(user));
    }

    @PatchMapping("/me/password")
    public ResponseEntity<?> changePassword(@AuthenticationPrincipal User user, @Valid @RequestBody ChangePasswordRequest body) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        userService.changePassword(user.getId(), body.getCurrentPassword(), body.getNewPassword());
        return ResponseEntity.noContent().build();
    }
}
