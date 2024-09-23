package backend.controller;

import backend.annotations.ApiController;
import backend.entity.Student;
import backend.service.StudentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;


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
    @GetMapping("student/{studentId}")
    public ResponseEntity<Student> getStudent(@PathVariable String studentId) {
        return studentService.findStudent(studentId);
    }
    @GetMapping("/student/all")
    public ResponseEntity<List<Student>> getStudentList(){
        return ResponseEntity.ok(studentService.getStudentList());
    }
    @GetMapping("/student/{batchYear}")
    public ResponseEntity<List<Student>> getStudentsByBatch(@PathVariable int batchYear) {
        List<Student> students = studentService.getstudentsbybatchyear(batchYear);
        return ResponseEntity.ok(students);
    }
    @GetMapping("/student/department")
    public ResponseEntity<List<Student>> countStudentsByDepartment() {
        List<Student> counts = studentService.getCountOfStudentsByDepartment();
        return ResponseEntity.ok(counts);
    }

}
