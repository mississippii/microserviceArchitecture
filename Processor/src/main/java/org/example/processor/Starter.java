package org.example.processor;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class Starter implements CommandLineRunner {

    private final Person person;

    public Starter(Person person) {
        this.person = person;
    }

    @Override
    public void run(String... args) throws Exception {
        person.showInfo();
    }
}
