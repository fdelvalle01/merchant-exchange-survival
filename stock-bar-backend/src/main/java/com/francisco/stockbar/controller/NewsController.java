package com.francisco.stockbar.controller;

import com.francisco.stockbar.dto.WorldNewsResponse;
import com.francisco.stockbar.services.WorldEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/news")
@RequiredArgsConstructor
public class NewsController {

    private final WorldEventService worldEventService;

    @GetMapping
    public List<WorldNewsResponse> getNews(@RequestParam(defaultValue = "100") int limit) {
        return worldEventService.getNews(limit);
    }

    @GetMapping("/latest")
    public List<WorldNewsResponse> getLatestNews(@RequestParam(defaultValue = "10") int limit) {
        return worldEventService.getNews(limit);
    }
}
