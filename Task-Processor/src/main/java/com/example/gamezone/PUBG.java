package com.example.gamezone;

import org.springframework.stereotype.Component;

@Component
public class PUBG implements Games{
    @Override
    public void playGame() {
        System.out.println("PUBG");
    }
}
