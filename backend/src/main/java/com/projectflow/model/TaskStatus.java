package com.projectflow.model;

import com.fasterxml.jackson.annotation.JsonValue;

public enum TaskStatus {
    TODO,
    IN_PROGRESS,
    COMPLETED;

    @JsonValue
    public String toJson() {
        return name().toLowerCase().replace("_", "-");
    }

    public static TaskStatus fromString(String value) {
        if (value == null || value.isBlank()) return TODO;
        String normalized = value
                .trim()
                .toUpperCase()
                .replace("_", "")
                .replace("-", "")
                .replace(" ", "")
                .replaceAll("[^A-Z]", "");
        if (normalized.contains("PROGRESS")) return IN_PROGRESS;
        if (normalized.contains("COMPLETE")) return COMPLETED;
        if (normalized.contains("TODO")) return TODO;
        return switch (normalized) {
            case "INPROGRESS" -> IN_PROGRESS;
            case "COMPLETED" -> COMPLETED;
            case "TODO" -> TODO;
            default -> TODO;
        };
    }
}
