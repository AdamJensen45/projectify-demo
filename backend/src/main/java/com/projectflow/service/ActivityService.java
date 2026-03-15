package com.projectflow.service;

import com.projectflow.model.Activity;
import com.projectflow.model.User;
import com.projectflow.repository.ActivityRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class ActivityService {

    private final ActivityRepository activityRepository;

    public ActivityService(ActivityRepository activityRepository) {
        this.activityRepository = activityRepository;
    }

    public List<Activity> getVisibleActivities(User currentUser) {
        if (currentUser.getRole() == User.UserRole.ADMIN) {
            return activityRepository.findAllByOrderByTimestampDesc();
        }
        return activityRepository.findByUserIdOrderByTimestampDesc(currentUser.getId());
    }

    public Activity log(User actor, String action, String target) {
        Activity activity = new Activity(
                actor.getId(),
                actor.getName(),
                action,
                target,
                Instant.now().toString()
        );
        return activityRepository.save(activity);
    }
}
