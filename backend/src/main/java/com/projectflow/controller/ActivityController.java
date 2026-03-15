package com.projectflow.controller;

import com.projectflow.model.Activity;
import com.projectflow.model.User;
import com.projectflow.service.ActivityService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activity")
public class ActivityController {

    private final ActivityService activityService;

    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @GetMapping
    public List<Activity> getAll(@AuthenticationPrincipal User user) {
        return activityService.getVisibleActivities(user);
    }
}
