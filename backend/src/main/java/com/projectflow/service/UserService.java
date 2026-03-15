package com.projectflow.service;

import com.projectflow.model.User;
import com.projectflow.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User create(String name, String email, String password, User.UserRole role) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already registered");
        }
        User user = new User(name, email, passwordEncoder.encode(password), role != null ? role : User.UserRole.MEMBER);
        return userRepository.save(user);
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
