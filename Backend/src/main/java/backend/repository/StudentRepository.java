package backend.repository;

import backend.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentRepository extends JpaRepository<Student, String> {
    Student findByStudentId(String studentId);
    @Query("SELECT s FROM Student s WHERE s.batchYear = :batchYear")
    List<Student> findStudentsByBatchYear(@Param("batchYear") int batchYear);

    @Query("SELECT s FROM Student s ORDER BY s.department")
    List<Student> findAllStudentsOrderedByDepartment();
}