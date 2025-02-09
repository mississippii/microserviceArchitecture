package backend.service;

import backend.dto.BatchCountDto;
import backend.dto.StudentBatchDto;
import backend.dto.StudentDto;
import backend.dto.UserDto;
import backend.entity.Student;
import backend.repository.StudentRepository;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final ModelMapper modelMapper;


    public StudentService(StudentRepository studentRepository,
                          ModelMapper modelMapper) {
        this.studentRepository = studentRepository;
        this.modelMapper = modelMapper;
    }

    public StudentDto getStudentById(UserDto user) {
        String studentId = user.getStudentId();
        Student student = studentRepository.findById(studentId).orElseThrow(()-> new IllegalStateException ("Student not found"));
        return modelMapper.map(student, StudentDto.class);
    }

    public List<StudentDto> getStudentByName(UserDto user) {
        String name = user.getName();
        List<Student>students = studentRepository.findByFirstNameContaining(name);
        return students.stream()
                .map(StudentDto::new)
               .collect(Collectors.toList());
    }


    public List<StudentDto> getAllStudents(){
        List<Student> students  = studentRepository.findAll();
        return students.stream()
                .map(StudentDto::new)
               .collect(Collectors.toList());
    }


    public List<StudentDto> getStudentsByYear(UserDto studentDto) {
        int batchYear = studentDto.getBatch();
        List<Student> students = studentRepository.findStudentsByBatchYear(batchYear);
        return students.stream()
                .map(StudentDto::new)
               .collect(Collectors.toList());
    }


    public List<StudentDto> getStudentsByDepartment(UserDto user) {
        String departmentName = user.getDepartment();
        List<Student> students = studentRepository.findAllStudentsByDepartment(departmentName);
        return students.stream()
                .map(StudentDto ::new)
                .collect(Collectors.toList());
    }


    public List<BatchCountDto> getStudentCountByBatch() {
        List<Object[]> results = studentRepository.countStudentsByBatchYear();
        return results.stream()
                .map(result -> new BatchCountDto((int) result[0], ((Long) result[1]).intValue()))
                .collect(Collectors.toList());
    }


    public int getAllStudentCount(){
        return studentRepository.totalStudentCount();
    }

}
