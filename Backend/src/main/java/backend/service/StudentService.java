package backend.service;

import backend.entity.Student;
import backend.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;

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
    public List<Student> getstudentsbybatchyear(int batchYear) {
        return studentRepository.findStudentsByBatchYear(batchYear);
    }


    public List<Student> getCountOfStudentsByDepartment() {
        return studentRepository.findAllStudentsOrderedByDepartment();
    }

}
