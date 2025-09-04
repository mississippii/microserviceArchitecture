package org.example.votingservice.service;

import org.example.votingservice.entity.Student;
import org.example.votingservice.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentService {

    private final StudentRepository studentRepository;

    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    public List<Student> insertAll(List<Student> students) {
       return studentRepository.saveAll(students);
    }

    public List<Student> getAllStudent() {
        List<Student> records = studentRepository.findAll();
        return records;
    }

    public Student getStudentById(String id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
    }
}
