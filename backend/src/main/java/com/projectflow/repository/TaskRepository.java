package com.projectflow.repository;

import com.projectflow.model.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, String> {

    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.assignee")
    List<Task> findAllWithAssignee();

    @Query(value = "SELECT t FROM Task t LEFT JOIN t.assignee a", countQuery = "SELECT COUNT(t) FROM Task t")
    Page<Task> findAllWithAssigneePage(Pageable pageable);

    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.assignee WHERE t.assignee.id = :assigneeId")
    List<Task> findByAssigneeIdWithAssignee(@Param("assigneeId") String assigneeId);

    @Query(value = "SELECT t FROM Task t LEFT JOIN FETCH t.assignee WHERE t.assignee.id = :assigneeId",
           countQuery = "SELECT COUNT(t) FROM Task t WHERE t.assignee.id = :assigneeId")
    Page<Task> findByAssigneeIdWithAssigneePage(@Param("assigneeId") String assigneeId, Pageable pageable);

    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.assignee WHERE t.projectId IN :projectIds AND t.assignee.id = :assigneeId")
    List<Task> findByProjectIdInAndAssigneeId(@Param("projectIds") Collection<String> projectIds, @Param("assigneeId") String assigneeId);

    @Query(value = "SELECT t FROM Task t LEFT JOIN FETCH t.assignee a WHERE t.projectId IN :projectIds AND t.assignee.id = :assigneeId " +
                   "AND (:search IS NULL OR :search = '' OR LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%')) OR (a IS NOT NULL AND LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%')))) " +
                   "AND (:status IS NULL OR :status = '' OR t.status = :status) AND (:priority IS NULL OR :priority = '' OR t.priority = :priority)",
           countQuery = "SELECT COUNT(t) FROM Task t LEFT JOIN t.assignee a WHERE t.projectId IN :projectIds AND t.assignee.id = :assigneeId " +
                       "AND (:search IS NULL OR :search = '' OR LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%')) OR (a IS NOT NULL AND LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%')))) " +
                       "AND (:status IS NULL OR :status = '' OR t.status = :status) AND (:priority IS NULL OR :priority = '' OR t.priority = :priority)")
    Page<Task> findByProjectIdInAndAssigneeIdWithFilters(@Param("projectIds") Collection<String> projectIds, @Param("assigneeId") String assigneeId,
                                                         @Param("search") String search, @Param("status") String status, @Param("priority") String priority, Pageable pageable);

    @Query(value = "SELECT t FROM Task t LEFT JOIN FETCH t.assignee " +
                   "WHERE (:search IS NULL OR :search = '' OR LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%')) OR (t.assignee IS NOT NULL AND LOWER(t.assignee.name) LIKE LOWER(CONCAT('%', :search, '%')))) " +
                   "AND (:status IS NULL OR :status = '' OR t.status = :status) AND (:priority IS NULL OR :priority = '' OR t.priority = :priority)",
           countQuery = "SELECT COUNT(t) FROM Task t LEFT JOIN t.assignee a WHERE (:search IS NULL OR :search = '' OR LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%')) OR (a IS NOT NULL AND LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%')))) " +
                       "AND (:status IS NULL OR :status = '' OR t.status = :status) AND (:priority IS NULL OR :priority = '' OR t.priority = :priority)")
    Page<Task> findAllWithFilters(@Param("search") String search, @Param("status") String status, @Param("priority") String priority, Pageable pageable);

    @Query(value = "SELECT t FROM Task t LEFT JOIN FETCH t.assignee WHERE t.assignee.id = :assigneeId " +
                   "AND (:search IS NULL OR :search = '' OR LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%')) OR (t.assignee IS NOT NULL AND LOWER(t.assignee.name) LIKE LOWER(CONCAT('%', :search, '%')))) " +
                   "AND (:status IS NULL OR :status = '' OR t.status = :status) AND (:priority IS NULL OR :priority = '' OR t.priority = :priority)",
           countQuery = "SELECT COUNT(t) FROM Task t LEFT JOIN t.assignee a WHERE t.assignee.id = :assigneeId " +
                       "AND (:search IS NULL OR :search = '' OR LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%')) OR (a IS NOT NULL AND LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%')))) " +
                       "AND (:status IS NULL OR :status = '' OR t.status = :status) AND (:priority IS NULL OR :priority = '' OR t.priority = :priority)")
    Page<Task> findByAssigneeIdWithFilters(@Param("assigneeId") String assigneeId, @Param("search") String search, @Param("status") String status, @Param("priority") String priority, Pageable pageable);

    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.assignee WHERE t.projectId = :projectId")
    List<Task> findByProjectId(@Param("projectId") String projectId);

    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.assignee WHERE t.projectId IN :projectIds")
    List<Task> findByProjectIdIn(@Param("projectIds") Collection<String> projectIds);

    boolean existsByProjectIdAndNameIgnoreCase(String projectId, String name);
}
