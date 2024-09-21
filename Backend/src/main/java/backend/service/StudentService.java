package backend.service;

import backend.entity.Student;
import backend.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentService {
    @Autowired
    private StudentRepository studentRepository;

    public void registerStudent(Student student) {
        if (studentRepository.findByStudentId(student.getStudentId()) != null) {
            throw new RuntimeException("Student already exists");
        }
        student.setActiveStatus(false);
        studentRepository.save(student);

    }

    public Student findStudent(String studentId) {
        return studentRepository.findByStudentId(studentId);
    }
}
