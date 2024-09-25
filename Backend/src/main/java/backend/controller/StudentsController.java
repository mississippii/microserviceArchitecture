package backend.controller;

import backend.annotations.ApiController;
import backend.dto.BatchCountDto;
import backend.dto.StudentBatchDto;
import backend.entity.Student;
import backend.service.StudentService;
import org.springframework.http.HttpStatus;
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
    @GetMapping("/student/batch/{batchYear}")
    public ResponseEntity<List<StudentBatchDto>> getStudentsByBatchYear(@PathVariable int batchYear) {
        List<StudentBatchDto> students = studentService.getStudentsByBatchYear(batchYear);

        if (students.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT); // No content if no students found
        }

        return new ResponseEntity<>(students, HttpStatus.OK); // Return the list with HTTP 200
    }
    @GetMapping("/student/department")
    public ResponseEntity<List<Student>> countStudentsByDepartment() {
        List<Student> counts = studentService.getCountOfStudentsByDepartment();
        return ResponseEntity.ok(counts);
    }
    @GetMapping("/students/batchcount")
    public ResponseEntity<List<BatchCountDto>> getBatchCount() {
        return studentService.getStudentCountByBatchYear();
    }

}
