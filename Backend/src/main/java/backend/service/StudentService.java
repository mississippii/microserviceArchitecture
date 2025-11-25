package backend.service;

import backend.dto.BatchCountDto;
import backend.dto.StudentDto;
import backend.dto.StudentEditableRequest;
import backend.dto.UserDto;
import backend.entity.Student;
import backend.repository.StudentRepository;
import backend.service.FileStorageService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final ModelMapper modelMapper;
    private final FileStorageService fileStorageService;


    public StudentService(StudentRepository studentRepository,
                          ModelMapper modelMapper,
                          FileStorageService fileStorageService) {
        this.studentRepository = studentRepository;
        this.modelMapper = modelMapper;
        this.fileStorageService = fileStorageService;
    }

    public StudentDto getStudentById(UserDto user) {
        String studentId = user.getStudentId();
        Student student = studentRepository.findById(studentId).orElseThrow(()-> new IllegalStateException ("Student not found"));
        StudentDto dto = modelMapper.map(student, StudentDto.class);
        normalizeProfile(dto);
        return dto;
    }

    public List<StudentDto> getStudentByName(UserDto user) {
        String name = user.getName();
        List<Student>students = studentRepository.findByFirstNameContaining(name);
        return students.stream()
                .map(StudentDto::new)
                .peek(this::normalizeProfile)
               .collect(Collectors.toList());
    }


    public List<StudentDto> getAllStudents(){
        List<Student> students  = studentRepository.findAll();
        return students.stream()
                .map(StudentDto::new)
                .peek(this::normalizeProfile)
               .collect(Collectors.toList());
    }


    public List<StudentDto> getStudentsByYear(UserDto studentDto) {
        int batchYear = studentDto.getBatch();
        List<Student> students = studentRepository.findStudentsByBatchYear(batchYear);
        return students.stream()
                .map(StudentDto::new)
                .peek(this::normalizeProfile)
                .collect(Collectors.toList());
    }


    public List<StudentDto> getStudentsByDepartment(UserDto user) {
        String departmentName = user.getDepartment();
        List<Student> students = studentRepository.findAllStudentsByDepartment(departmentName);
        return students.stream()
                .map(StudentDto ::new)
                .peek(this::normalizeProfile)
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

    public StudentDto saveEditable(StudentEditableRequest request) {
        if (request.getStudentId() == null || request.getStudentId().isBlank()) {
            throw new IllegalArgumentException("Student ID is required");
        }
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new IllegalStateException("Student not found"));

        student.setFirstName(request.getFirstName());
        student.setLastName(request.getLastName());
        student.setEmail(request.getEmail());
        student.setPhoneNumber(request.getPhoneNumber());
        student.setProfilePic(request.getProfilePic());
        if (request.getBatchYear() != null) {
            student.setBatchYear(request.getBatchYear());
        }
        student.setOccupation(request.getOccupation());
        student.setOrganizationName(request.getOrganizationName());
        student.setBloodGroup(request.getBloodGroup());
        student.setAddress(request.getAddress());
        student.setDepartment(request.getDepartment());
        student.setFacebook(request.getFacebook());
        student.setInstagram(request.getInstagram());
        student.setLinkedin(request.getLinkedin());
        student.setYoutube(request.getYoutube());

        Student saved = studentRepository.save(student);
        StudentDto dto = modelMapper.map(saved, StudentDto.class);
        normalizeProfile(dto);
        return dto;
    }

    private void normalizeProfile(StudentDto dto) {
        if (dto == null) return;
        String normalized = fileStorageService.normalizeProfileUrl(dto.getProfilePic(), dto.getStudentId());
        if (normalized != null) {
            dto.setProfilePic(normalized);
        } else if (dto.getProfilePic() == null || dto.getProfilePic().isBlank()) {
            String existing = fileStorageService.findExistingUrlById(dto.getStudentId());
            if (existing != null) {
                dto.setProfilePic(existing);
            }
        }
    }

}
