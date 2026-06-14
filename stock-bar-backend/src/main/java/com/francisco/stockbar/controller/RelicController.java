package com.francisco.stockbar.controller;

import com.francisco.stockbar.dto.RelicActivationRequest;
import com.francisco.stockbar.dto.RelicActivationResponse;
import com.francisco.stockbar.dto.RelicEquipRequest;
import com.francisco.stockbar.dto.RelicHistoryResponse;
import com.francisco.stockbar.dto.RelicReorderRequest;
import com.francisco.stockbar.dto.RelicResponse;
import com.francisco.stockbar.services.RelicService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/game/relics")
@RequiredArgsConstructor
public class RelicController {

    private final RelicService relicService;

    @GetMapping
    public List<RelicResponse> relics() {
        return relicService.getRelics();
    }

    @GetMapping("/history")
    public List<RelicHistoryResponse> history() {
        return relicService.getHistory();
    }

    @PostMapping("/{id}/equip")
    public RelicResponse equip(@PathVariable Long id, @RequestBody RelicEquipRequest request) {
        return relicService.equip(id, request.getSlot());
    }

    @PostMapping("/{id}/unequip")
    public RelicResponse unequip(@PathVariable Long id) {
        return relicService.unequip(id);
    }

    @PostMapping("/{id}/activate")
    public RelicActivationResponse activate(
            @PathVariable Long id,
            @RequestBody(required = false) RelicActivationRequest request
    ) {
        return relicService.activate(id, request == null ? new RelicActivationRequest() : request);
    }

    @PostMapping("/reorder")
    public RelicResponse reorder(@RequestBody RelicReorderRequest request) {
        return relicService.equip(request.getRelicId(), request.getTargetSlot());
    }
}
