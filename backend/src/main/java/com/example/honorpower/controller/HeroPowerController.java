package com.example.honorpower.controller;

import com.example.honorpower.domain.GameChannel;
import com.example.honorpower.domain.GamePlatform;
import com.example.honorpower.dto.HeroPowerQueryResponse;
import com.example.honorpower.dto.HeroSummary;
import com.example.honorpower.dto.OptionResponse;
import com.example.honorpower.dto.OptionResponse.OptionItem;
import com.example.honorpower.service.HeroPowerService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

@Validated
@RestController
@RequestMapping("/api")
public class HeroPowerController {

    private final HeroPowerService service;

    public HeroPowerController(HeroPowerService service) {
        this.service = service;
    }

    @GetMapping("/heroes")
    public List<HeroSummary> searchHeroes(@RequestParam(defaultValue = "") String keyword) {
        return service.searchHeroes(keyword);
    }

    @GetMapping("/power/query")
    public HeroPowerQueryResponse query(
            @RequestParam @NotBlank(message = "请选择英雄") String heroName,
            @RequestParam GamePlatform platform,
            @RequestParam GameChannel channel,
            @RequestParam(defaultValue = "wzryqz") String provider
    ) {
        return service.query(heroName, platform, channel, provider);
    }

    @GetMapping("/options")
    public OptionResponse options() {
        List<OptionItem> platforms = Arrays.stream(GamePlatform.values())
                .map(value -> new OptionItem(value.name(), value.getLabel()))
                .toList();
        List<OptionItem> channels = Arrays.stream(GameChannel.values())
                .map(value -> new OptionItem(value.name(), value.getLabel()))
                .toList();
        List<OptionItem> providers = service.providerOptions();
        return new OptionResponse(platforms, channels, providers);
    }
}
