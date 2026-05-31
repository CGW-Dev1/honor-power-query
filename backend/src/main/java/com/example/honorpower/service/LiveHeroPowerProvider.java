package com.example.honorpower.service;

import com.example.honorpower.domain.GameChannel;
import com.example.honorpower.domain.GamePlatform;
import com.example.honorpower.domain.HeroPowerRecord;
import com.example.honorpower.domain.RegionLevel;
import com.example.honorpower.dto.HeroPowerQueryResponse.Placement;
import com.example.honorpower.dto.HeroPowerQueryResponse.PowerRanking;
import com.example.honorpower.dto.OptionResponse.OptionItem;
import com.example.honorpower.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class LiveHeroPowerProvider {

    private static final DateTimeFormatter WZRYQZ_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter XXOO_TIME = DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss");

    private final RestClient restClient;
    private final boolean enabled;
    private final String wzryqzEndpoint;
    private final String xxooEndpoint;

    public LiveHeroPowerProvider(
            RestClient.Builder restClientBuilder,
            @Value("${app.live-provider.enabled:true}") boolean enabled,
            @Value("${app.live-provider.wzryqz-endpoint:${app.live-provider.endpoint:https://api.wzryqz.cn/gethero}}") String wzryqzEndpoint,
            @Value("${app.live-provider.xxoo-endpoint:https://api.xxoo.team/hero/getHeroInfo.php}") String xxooEndpoint
    ) {
        this.restClient = restClientBuilder.build();
        this.enabled = enabled;
        this.wzryqzEndpoint = wzryqzEndpoint;
        this.xxooEndpoint = xxooEndpoint;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public List<OptionItem> options() {
        return List.of(
                new OptionItem("wzryqz", "王者圈子接口（推荐，含前10）"),
                new OptionItem("xxoo", "XXOO备用接口（最低值）")
        );
    }

    public LivePowerSnapshot query(String providerId, String heroName, GamePlatform platform, GameChannel channel) {
        String normalizedProvider = providerId == null ? "wzryqz" : providerId.trim().toLowerCase();
        return switch (normalizedProvider) {
            case "xxoo" -> queryXxoo(heroName, platform, channel);
            case "wzryqz" -> queryWzryqz(heroName, platform, channel);
            default -> throw new ResourceNotFoundException("未知数据接口，请重新选择");
        };
    }

    private LivePowerSnapshot queryWzryqz(String heroName, GamePlatform platform, GameChannel channel) {
        String sourceName = "api.wzryqz.cn 第三方聚合数据";
        JsonNode root;
        try {
            root = restClient.get()
                    .uri(wzryqzEndpoint + "?hero={hero}&type={type}", heroName, toProviderType(platform, channel))
                    .retrieve()
                    .body(JsonNode.class);
        } catch (Exception exception) {
            throw new ResourceNotFoundException("王者圈子接口暂不可用，请切换备用接口或稍后重试");
        }

        if (root == null || root.path("code").asInt() != 200 || root.path("data").isMissingNode()) {
            throw new ResourceNotFoundException("王者圈子接口暂无该英雄在当前分区的战力数据");
        }

        JsonNode data = root.path("data");
        LocalDateTime updatedAt = parseTime(data.path("updatetime").asText(""), WZRYQZ_TIME);
        String resolvedHeroName = data.path("name").asText(heroName);
        List<PowerRanking> rankings = new ArrayList<>();

        rankings.add(ranking(RegionLevel.DISTRICT, data.path("county")));
        rankings.add(ranking(RegionLevel.CITY, data.path("city")));
        rankings.add(ranking(RegionLevel.PROVINCE, data.path("province")));

        int top100Power = parsePower(data.path("Top100").asText(""));
        int top10Power = parsePower(data.path("Top10").asText(""));
        if (top100Power > 0) {
            rankings.add(new PowerRanking(
                    RegionLevel.NATIONAL_TOP100,
                    RegionLevel.NATIONAL_TOP100.getLabel(),
                    "全国榜第100名",
                    top100Power,
                    List.of(new Placement(100, "全国榜第100名", top100Power))
            ));
        }
        if (top10Power > 0) {
            rankings.add(new PowerRanking(
                    RegionLevel.NATIONAL_TOP10,
                    RegionLevel.NATIONAL_TOP10.getLabel(),
                    "全国榜第10名",
                    top10Power,
                    List.of(new Placement(10, "全国榜第10名", top10Power))
            ));
        }

        rankings = rankings.stream().filter(item -> item.power() != null && item.power() > 0).toList();
        if (rankings.isEmpty()) {
            throw new ResourceNotFoundException("王者圈子接口返回为空，请稍后重试");
        }

        return new LivePowerSnapshot(
                records(resolvedHeroName, platform, channel, updatedAt, sourceName, rankings),
                rankings,
                sourceName
        );
    }

    private LivePowerSnapshot queryXxoo(String heroName, GamePlatform platform, GameChannel channel) {
        String sourceName = "api.xxoo.team 备用聚合数据";
        JsonNode root;
        try {
            root = restClient.get()
                    .uri(xxooEndpoint + "?hero={hero}&type={type}", heroName, toProviderType(platform, channel))
                    .retrieve()
                    .body(JsonNode.class);
        } catch (Exception exception) {
            throw new ResourceNotFoundException("XXOO备用接口暂不可用，请切换推荐接口或稍后重试");
        }

        if (root == null || root.path("code").asInt() != 200 || root.path("data").isMissingNode()) {
            throw new ResourceNotFoundException("XXOO备用接口暂无该英雄在当前分区的战力数据");
        }

        JsonNode data = root.path("data");
        String resolvedHeroName = data.path("name").asText(heroName);
        LocalDateTime updatedAt = parseTime(data.path("updatetime").asText(""), XXOO_TIME);
        List<PowerRanking> rankings = List.of(
                single(RegionLevel.DISTRICT, data.path("area").asText("未知区县"), data.path("areaPower").asText("")),
                single(RegionLevel.CITY, data.path("city").asText("未知城市"), data.path("cityPower").asText("")),
                single(RegionLevel.PROVINCE, data.path("province").asText("未知省份"), data.path("provincePower").asText("")),
                single(RegionLevel.NATIONAL_TOP100, "全国榜第100名", data.path("guobiao").asText(""))
        ).stream().filter(item -> item.power() != null && item.power() > 0).toList();

        if (rankings.isEmpty()) {
            throw new ResourceNotFoundException("XXOO备用接口返回为空，请稍后重试");
        }

        return new LivePowerSnapshot(
                records(resolvedHeroName, platform, channel, updatedAt, sourceName, rankings),
                rankings,
                sourceName
        );
    }

    private PowerRanking ranking(RegionLevel level, JsonNode rows) {
        List<Placement> placements = new ArrayList<>();
        if (rows.isArray()) {
            int rank = 1;
            for (JsonNode row : rows) {
                if (rank > 10) {
                    break;
                }
                placements.add(new Placement(rank, row.path("loc").asText("未知地区"), row.path("val").asInt()));
                rank++;
            }
        }

        if (placements.isEmpty()) {
            return new PowerRanking(level, level.getLabel(), "暂无数据", 0, List.of());
        }

        Placement lowest = placements.get(0);
        return new PowerRanking(level, level.getLabel(), lowest.regionName(), lowest.power(), placements);
    }

    private PowerRanking single(RegionLevel level, String regionName, String power) {
        int value = parsePower(power);
        return new PowerRanking(
                level,
                level.getLabel(),
                regionName,
                value,
                value > 0 ? List.of(new Placement(1, regionName, value)) : List.of()
        );
    }

    private List<HeroPowerRecord> records(
            String heroName,
            GamePlatform platform,
            GameChannel channel,
            LocalDateTime updatedAt,
            String sourceName,
            List<PowerRanking> rankings
    ) {
        return rankings.stream()
                .map(ranking -> new HeroPowerRecord(
                        heroName,
                        platform,
                        channel,
                        ranking.level(),
                        ranking.regionName(),
                        ranking.power(),
                        updatedAt,
                        sourceName
                ))
                .toList();
    }

    private String toProviderType(GamePlatform platform, GameChannel channel) {
        if (platform == GamePlatform.ANDROID && channel == GameChannel.QQ) {
            return "aqq";
        }
        if (platform == GamePlatform.ANDROID && channel == GameChannel.WECHAT) {
            return "awx";
        }
        if (platform == GamePlatform.IOS && channel == GameChannel.QQ) {
            return "iqq";
        }
        return "iwx";
    }

    private LocalDateTime parseTime(String value, DateTimeFormatter formatter) {
        try {
            return LocalDateTime.parse(value, formatter);
        } catch (Exception exception) {
            return LocalDateTime.now().withSecond(0).withNano(0);
        }
    }

    private int parsePower(String value) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException exception) {
            return 0;
        }
    }

    public record LivePowerSnapshot(
            List<HeroPowerRecord> records,
            List<PowerRanking> rankings,
            String sourceName
    ) {
    }
}
