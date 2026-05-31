package com.example.honorpower.service;

import com.example.honorpower.dto.HeroSummary;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Comparator;
import java.util.List;
import java.util.stream.StreamSupport;

@Service
public class HeroCatalogService {

    private static final String DEFAULT_HERO_LIST_URL = "https://pvp.qq.com/web201605/js/herolist.json";

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String heroListUrl;
    private volatile List<HeroSummary> cache = List.of();

    public HeroCatalogService(
            RestClient.Builder restClientBuilder,
            ObjectMapper objectMapper,
            @Value("${app.hero-list-url:" + DEFAULT_HERO_LIST_URL + "}") String heroListUrl
    ) {
        this.restClient = restClientBuilder.build();
        this.objectMapper = objectMapper;
        this.heroListUrl = heroListUrl;
    }

    public List<HeroSummary> search(String keyword) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim().toLowerCase();
        return loadAll().stream()
                .filter(hero -> normalizedKeyword.isBlank()
                        || hero.name().toLowerCase().contains(normalizedKeyword)
                        || hero.title().toLowerCase().contains(normalizedKeyword))
                .toList();
    }

    public List<HeroSummary> loadAll() {
        List<HeroSummary> current = cache;
        if (!current.isEmpty()) {
            return current;
        }

        synchronized (this) {
            if (!cache.isEmpty()) {
                return cache;
            }
            cache = fetchHeroes();
            return cache;
        }
    }

    private List<HeroSummary> fetchHeroes() {
        try {
            byte[] body = restClient.get()
                    .uri(heroListUrl)
                    .retrieve()
                    .body(byte[].class);

            JsonNode root = objectMapper.readTree(new String(body, StandardCharsets.UTF_8));
            return StreamSupport.stream(root.spliterator(), false)
                    .map(node -> {
                        int ename = node.path("ename").asInt();
                        String name = node.path("cname").asText();
                        String title = node.path("title").asText();
                        String iconUrl = "https://game.gtimg.cn/images/yxzj/img201606/heroimg/" + ename + "/" + ename + ".jpg";
                        return new HeroSummary(name, title, iconUrl);
                    })
                    .sorted(Comparator.comparing(HeroSummary::name))
                    .toList();
        } catch (Exception exception) {
            return List.of(
                    new HeroSummary("李白", "青莲剑仙", "https://game.gtimg.cn/images/yxzj/img201606/heroimg/131/131.jpg"),
                    new HeroSummary("孙悟空", "齐天大圣", "https://game.gtimg.cn/images/yxzj/img201606/heroimg/167/167.jpg"),
                    new HeroSummary("王昭君", "冰雪之华", "https://game.gtimg.cn/images/yxzj/img201606/heroimg/152/152.jpg")
            );
        }
    }
}
