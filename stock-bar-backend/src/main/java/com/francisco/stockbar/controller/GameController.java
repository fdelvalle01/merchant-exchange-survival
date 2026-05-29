package com.francisco.stockbar.controller;

import com.francisco.stockbar.dto.GameStateResponse;
import com.francisco.stockbar.services.GameClockService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/game")
@RequiredArgsConstructor
public class GameController {

    private final GameClockService gameClockService;

    @GetMapping("/state")
    public GameStateResponse state() {
        return gameClockService.getCurrentState();
    }

    @PostMapping("/end-day")
    public GameStateResponse endDay() {
        return gameClockService.endDay();
    }
}
