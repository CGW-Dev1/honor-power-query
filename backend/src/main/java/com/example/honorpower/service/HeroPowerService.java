package com.example.honorpower.service;

import com.example.honorpower.domain.GameChannel;
import com.example.honorpower.domain.GamePlatform;
import com.example.honorpower.domain.HeroPowerRecord;
import com.example.honorpower.dto.HeroSummary;
import com.example.honorpower.dto.HeroPowerQueryResponse;
import com.example.honorpower.dto.OptionResponse.OptionItem;
import com.example.honorpower.dto.HeroPowerQueryResponse.PowerRanking;
import com.example.honorpower.dto.HeroPowerQueryResponse.Placement;
import com.example.honorpower.exception.ResourceNotFoundException;
import com.example.honorpower.repository.HeroPowerRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class HeroPowerService {

    private final HeroPowerRecordRepository repository;
    private final HeroCatalogService heroCatalogService;
    private final LiveHeroPowerProvider liveHeroPowerProvider;

    public HeroPowerService(
            HeroPowerRecordRepository repository,
            HeroCatalogService heroCatalogService,
            LiveHeroPowerProvider liveHeroPowerProvider
    ) {
        this.repository = repository;
        this.heroCatalogService = heroCatalogService;
        this.liveHeroPowerProvider = liveHeroPowerProvider;
    }

    public List<HeroSummary> searchHeroes(String keyword) {
        return heroCatalogService.search(keyword);
    }

    public List<OptionItem> providerOptions() {
        return liveHeroPowerProvider.options();
    }

    @Transactional
    public HeroPowerQueryResponse query(String heroName, GamePlatform platform, GameChannel channel, String provider) {
        String normalizedHeroName = heroName.trim();
        List<HeroPowerRecord> records = List.of();
        List<PowerRanking> liveRankings = List.of();
        String sourceType = "CACHE";
        String sourceName = "本地缓存";

        if (liveHeroPowerProvider.isEnabled()) {
            LiveHeroPowerProvider.LivePowerSnapshot snapshot = liveHeroPowerProvider.query(
                    provider,
                    normalizedHeroName,
                    platform,
                    channel
            );
            records = snapshot.records();
            liveRankings = snapshot.rankings();
            sourceName = snapshot.sourceName();
            repository.deleteByHeroNameAndPlatformAndChannel(normalizedHeroName, platform, channel);
            repository.flush();
            repository.saveAll(records);
            sourceType = "LIVE";
        }

        if (records.isEmpty()) {
            records = repository.findByHeroNameAndPlatformAndChannel(
                    normalizedHeroName,
                    platform,
                    channel
            );
        }

        if (records.isEmpty()) {
            throw new ResourceNotFoundException("暂无该英雄在当前分区的战力数据");
        }

        return buildResponse(normalizedHeroName, platform, channel, records, sourceType, sourceName, liveRankings);
    }

    private HeroPowerQueryResponse buildResponse(
            String heroName,
            GamePlatform platform,
            GameChannel channel,
            List<HeroPowerRecord> records,
            String sourceType,
            String sourceName,
            List<PowerRanking> liveRankings
    ) {
        List<PowerRanking> rankings = liveRankings.isEmpty()
                ? records.stream()
                .sorted(Comparator.comparingInt(record -> record.getRegionLevel().getOrder()))
                .map(record -> new PowerRanking(
                        record.getRegionLevel(),
                        record.getRegionLevel().getLabel(),
                        record.getRegionName(),
                        record.getPower(),
                        List.of(new Placement(1, record.getRegionName(), record.getPower()))
                ))
                .toList()
                : liveRankings;

        LocalDateTime updatedAt = records.stream()
                .map(HeroPowerRecord::getUpdatedAt)
                .max(LocalDateTime::compareTo)
                .orElseThrow();

        String resolvedSourceName = records.stream()
                .map(HeroPowerRecord::getSourceName)
                .filter(value -> value != null && !value.isBlank())
                .findFirst()
                .orElse(sourceName);

        return new HeroPowerQueryResponse(
                heroName.trim(),
                platform,
                platform.getLabel(),
                channel,
                channel.getLabel(),
                updatedAt,
                resolvedSourceName,
                sourceType,
                "战力数据来自第三方聚合接口，不是腾讯官方开放 API；小国标为全国榜第100名，大国标为全国榜第10名。",
                rankings
        );
    }
}
