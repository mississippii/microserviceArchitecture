package com.example.gamezone;

import org.springframework.stereotype.Component;

@Component
public class TickTackTo implements Games{
    @Override
    public void playGame() {
        System.out.println("Tick Tack To");
    }
}
