package backend.service;

import backend.entity.Address;
import backend.entity.Employee;
import backend.repository.AddressRepo;
import backend.repository.EmployeeRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class EmployeeService {
    private final EmployeeRepo employeeRepo;
    private final AddressRepo addressRepo;

    public EmployeeService(EmployeeRepo employeeRepo, AddressRepo addressRepo) {
        this.employeeRepo = employeeRepo;
        this.addressRepo = addressRepo;
    }

    public ResponseEntity<Void>save(Employee employee){
        Optional<Address> address = addressRepo.findById(employee.getAddress().getId());
        if(!address.isPresent()){
            return ResponseEntity.badRequest().build();
        }
        employee.setAddress(address.get());
        employeeRepo.save(employee);
        return ResponseEntity.ok().build();
    }
}
