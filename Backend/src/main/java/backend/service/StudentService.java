package backend.service;

import backend.dto.BatchCountDto;
import backend.dto.StudentBatchDto;
import backend.entity.Student;
import backend.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudentService {
    @Autowired
    private StudentRepository studentRepository;

    public ResponseEntity<Student> findStudent(String studentId) {
        if (studentRepository.existsById(studentId)) {
            return ResponseEntity.ok(studentRepository.findByStudentId(studentId));
        }
        return ResponseEntity.notFound().build();
    }
    public List<Student> getStudentList(){
        return studentRepository.findAll();
    }
    public List<Student> getStudentsByYear(int batchYear) {
        return studentRepository.findStudentsByBatchYear(batchYear);
    }


    public List<Student> getCountOfStudentsByDepartment() {
        return studentRepository.findAllStudentsOrderedByDepartment();
    }
    public ResponseEntity<List<BatchCountDto>> getStudentCountByBatchYear() {
        List<Object[]> results = studentRepository.countStudentsByBatchYear();
        List<BatchCountDto> batchCounts = new ArrayList<>();

        for (Object[] result : results) {
            // Ensure correct type casting
            Integer batchYear = ((Number) result[0]).intValue();  // Cast to Number then to Integer
            Integer count = ((Long) result[1]).intValue();        // Cast Long to Integer

            // Create and add a new BatchCountDto
            batchCounts.add(new BatchCountDto(batchYear, count));
        }

        return ResponseEntity.ok(batchCounts);
    }

    public List<StudentBatchDto> getStudentsByBatchYear(int batchYear) {
        List<Student> students = studentRepository.findStudentsByBatchYear(batchYear);

        return students.stream()
                .map(student -> new StudentBatchDto(student.getStudentId(), student.getFirstName(), student.getLastName(),student.getSex()))
                .collect(Collectors.toList());
    }
    public int getAllStudentCount(){
        return studentRepository.totalStudentCount();
    }

}
