package com.projectflow.controller;

import com.projectflow.model.Activity;
import com.projectflow.model.User;
import com.projectflow.service.ActivityService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
    public Object getAll(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @AuthenticationPrincipal User user) {
        if (page != null && size != null) {
            Pageable pageable = PageRequest.of(page, size);
            return activityService.getVisibleActivitiesPaginated(user, pageable);
        }
        return activityService.getVisibleActivities(user);
    }
}
