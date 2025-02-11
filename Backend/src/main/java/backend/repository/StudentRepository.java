package backend.repository;

import backend.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentRepository extends JpaRepository<Student, String> {

    @Query("SELECT s FROM Student s WHERE s.firstName LIKE %:firstName%")
    List<Student> findByFirstNameContaining(@Param("firstName") String firstName);


    @Query("SELECT s FROM Student s WHERE s.batchYear = :batchYear")
    List<Student> findStudentsByBatchYear(@Param("batchYear") int batchYear);

    @Query("SELECT s FROM Student s WHERE s.department = :deptName")
    List<Student> findAllStudentsByDepartment(@Param("deptName") String deptName);

    @Query("SELECT s.batchYear, COUNT(s) FROM Student s GROUP BY s.batchYear")
    List<Object[]> countStudentsByBatchYear();

    @Query("SELECT COUNT(s) FROM Student s")
    int totalStudentCount();
}
