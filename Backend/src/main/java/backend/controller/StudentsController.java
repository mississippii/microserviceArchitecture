package backend.controller;

import backend.annotations.ApiController;
import backend.entity.Student;
import backend.service.StudentService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@ApiController()
public class StudentsController {
    private final StudentService studentService;

    public StudentsController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping("student/name")
    public String getname(){
        return "Tanveer Hasan";
    }
    @PostMapping("student/register")
    public void registerStudent(@RequestBody Student student) {
        studentService.registerStudent(student);
    }

    @GetMapping("student/{studentId}")
    public Student getStudent(@PathVariable String studentId) {
        return studentService.findStudent(studentId);
    }
}
