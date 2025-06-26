package com.example.gamezone;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class AppStarter implements CommandLineRunner {
    private final GameLoop gameLoop;

    public AppStarter(GameLoop gameLoop) {
        this.gameLoop = gameLoop;
    }

    @Override
    public void run(String... args) throws Exception {
        gameLoop.startGame();
    }
}
