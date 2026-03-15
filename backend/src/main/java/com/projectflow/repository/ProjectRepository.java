package com.projectflow.repository;

import com.projectflow.model.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, String> {
    List<Project> findByIdIn(List<String> ids);
    List<Project> findByCreatedBy_Id(String userId);
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, String id);

    @Query("SELECT p FROM Project p WHERE (:ids IS NULL OR p.id IN :ids) " +
           "AND (:status IS NULL OR :status = '' OR p.status = :status) " +
           "AND (:search IS NULL OR :search = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(COALESCE(p.description,'')) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Project> findWithFilters(@Param("ids") List<String> ids, @Param("status") String status,
                                  @Param("search") String search, Pageable pageable);
}
