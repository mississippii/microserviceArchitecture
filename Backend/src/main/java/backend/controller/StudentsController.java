package backend.controller;

import backend.dto.BatchCountDto;
import backend.dto.StudentDto;
import backend.dto.UserDto;
import backend.service.StudentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController()
@CrossOrigin(value = "*")
@RequestMapping("/students")
public class StudentsController {
    private final StudentService studentService;

    public StudentsController(StudentService studentService) {
        this.studentService = studentService;
    }


    @PostMapping("/count")
    public ResponseEntity<Integer> getStudentCount(){
        return ResponseEntity.ok(studentService.getAllStudentCount());
    }

    @PostMapping("/find-by-id")
    public ResponseEntity<StudentDto> getStudent(@RequestBody UserDto userDto) {
        return ResponseEntity.ok(studentService.getStudentById(userDto)) ;
    }
    @PostMapping("/find-by-name")
    public ResponseEntity<List<StudentDto>> getBatchStudents(@RequestBody UserDto userDto) {
        try{
            List<StudentDto> students = studentService.getStudentByName(userDto);
            return ResponseEntity.ok(students);
        }catch (Exception e){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping("/find-all")
    public ResponseEntity<List<StudentDto>> getStudentList(){
        try {
            List<StudentDto> students = studentService.getAllStudents();
            return ResponseEntity.ok(students);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping("/find-batch")
    public ResponseEntity<List<StudentDto>> getStudentsByBatchYear(@RequestBody UserDto userDto) {
        try {
            List<StudentDto> students = studentService.getStudentsByYear(userDto);
            return ResponseEntity.ok(students);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping("/department")
    public ResponseEntity<List<StudentDto>> countStudentsByDepartment(@RequestBody UserDto userDto) {
        List<StudentDto> students = studentService.getStudentsByDepartment(userDto);
        return ResponseEntity.ok(students);
    }

    @PostMapping("/count-by-batch")
    public ResponseEntity<List<BatchCountDto>> getBatchCount() {
        try{
            List<BatchCountDto> batchCount = studentService.getStudentCountByBatch();
            return ResponseEntity.ok(batchCount);
        }catch(Exception e){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

}
