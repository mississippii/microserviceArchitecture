package backend.controller;

import backend.annotations.ApiController;
import backend.entity.Address;
import backend.entity.Employee;
import backend.service.AddressService;
import backend.service.EmployeeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@ApiController
public class DarkController {
    private final AddressService addressService;
    private final EmployeeService employeeService;
    public DarkController(AddressService addressService, EmployeeService employeeService) {
        this.addressService = addressService;
        this.employeeService = employeeService;
    }
    @PostMapping("/employee-create")
    public ResponseEntity<Void> create(@RequestBody Employee employee){
        return employeeService.save(employee);
    }
    @PostMapping("/address-create")
    public ResponseEntity<Void> create(@RequestBody Address address){
        return addressService.save(address);
    }
}
