package org.example.votingservice.controller;

import org.example.votingservice.entity.Student;
import org.example.votingservice.service.StudentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @PostMapping("/string")
    public String getString() {
        return "Hello World";
    }

    @PostMapping("/student/bulk")
    public List<Student> addStudents(@RequestBody List<Student> students) {;
        return studentService.insertAll(students);
    }

    @PostMapping("/student/{id}")
    public ResponseEntity<?> findStudentById(@PathVariable String id) {
        try {
            Student student = studentService.getStudentById(id);
            return ResponseEntity.ok(student);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/student/all")
    public List<Student>getAllStudents() {
        return studentService.getAllStudent();
    }
}
