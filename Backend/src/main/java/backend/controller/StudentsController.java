package backend.controller;

import backend.annotations.ApiController;
import backend.entity.Student;
import backend.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@ApiController("/students")
public class StudentsController {
    @Autowired
    private StudentService studentService;

    @PostMapping("/register")
    public void registerStudent(@RequestBody Student student) {
        studentService.registerStudent(student);
    }

    @GetMapping("/{studentId}")
    public Student getStudent(@PathVariable String studentId) {
        return studentService.findStudent(studentId);
    }
}
