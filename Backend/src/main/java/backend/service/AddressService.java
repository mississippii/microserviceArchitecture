package backend.service;

import backend.entity.Address;
import backend.repository.AddressRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
public class AddressService {
    private final AddressRepo addressRepo;

    public AddressService(AddressRepo addressRepo) {
        this.addressRepo = addressRepo;
    }

    public ResponseEntity<Void>save(Address address){
        addressRepo.save(address);
        return ResponseEntity.ok().build();
    }
}
