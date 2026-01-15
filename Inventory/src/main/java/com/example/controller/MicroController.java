package com.example.controller;

import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Post;

@Controller("/api/v1")
public class MicroController {

    @Post("/string")
    public String getString(){
        return "Hello Micronaute   !!";
    }
}
