package backend.service;

import backend.dto.StudentDto;
import backend.dto.UserDto;
import backend.entity.Student;
import backend.repository.StudentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private StudentService studentService;

    @Test
    void getStudentsByDepartment_returnsDtosWithNormalizedProfiles() {
        UserDto user = new UserDto();
        user.setDepartment("CSE");

        Student alice = new Student();
        alice.setStudentId("S-1");
        alice.setFirstName("Alice");
        alice.setDepartment("CSE");
        alice.setProfilePic("http://old.local/old-alice.png");

        Student bob = new Student();
        bob.setStudentId("S-2");
        bob.setFirstName("Bob");
        bob.setDepartment("CSE");
        bob.setProfilePic("http://old.local/old-bob.png");

        when(studentRepository.findAllStudentsByDepartment("CSE"))
                .thenReturn(List.of(alice, bob));
        when(fileStorageService.normalizeProfileUrl(anyString(), anyString()))
                .thenReturn("http://cdn/new.png");

        List<StudentDto> result = studentService.getStudentsByDepartment(user);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getFirstName()).isEqualTo("Alice");
        assertThat(result.get(0).getProfilePic()).isEqualTo("http://cdn/new.png");
        assertThat(result.get(1).getFirstName()).isEqualTo("Bob");
        assertThat(result.get(1).getProfilePic()).isEqualTo("http://cdn/new.png");

        verify(studentRepository).findAllStudentsByDepartment("CSE");
        verify(fileStorageService, times(2)).normalizeProfileUrl(anyString(), anyString());
        verifyNoMoreInteractions(studentRepository, fileStorageService);
    }
}
