package com.example.gamezone;

import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class GameLoop {
    private final List<Games> games;

    public GameLoop(List<Games> games) {
        this.games = games;
    }

    public void startGame() {
        for (Games game : games) {
            game.playGame();
        }
    }
}
