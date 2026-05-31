package com.example.honorpower.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "hero_power_record",
        indexes = {
                @Index(name = "idx_hero_power_query", columnList = "hero_name,platform,channel"),
                @Index(name = "idx_hero_power_updated_at", columnList = "updated_at")
        },
        uniqueConstraints = @UniqueConstraint(
                name = "uk_hero_power_snapshot",
                columnNames = {"hero_name", "platform", "channel", "region_level"}
        )
)
public class HeroPowerRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hero_name", nullable = false, length = 32)
    private String heroName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private GamePlatform platform;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private GameChannel channel;

    @Enumerated(EnumType.STRING)
    @Column(name = "region_level", nullable = false, length = 16)
    private RegionLevel regionLevel;

    @Column(name = "region_name", nullable = false, length = 64)
    private String regionName;

    @Column(nullable = false)
    private Integer power;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "source_name", length = 64)
    private String sourceName;

    protected HeroPowerRecord() {
    }

    public HeroPowerRecord(
            String heroName,
            GamePlatform platform,
            GameChannel channel,
            RegionLevel regionLevel,
            String regionName,
            Integer power,
            LocalDateTime updatedAt
    ) {
        this(heroName, platform, channel, regionLevel, regionName, power, updatedAt, "本地缓存");
    }

    public HeroPowerRecord(
            String heroName,
            GamePlatform platform,
            GameChannel channel,
            RegionLevel regionLevel,
            String regionName,
            Integer power,
            LocalDateTime updatedAt,
            String sourceName
    ) {
        this.heroName = heroName;
        this.platform = platform;
        this.channel = channel;
        this.regionLevel = regionLevel;
        this.regionName = regionName;
        this.power = power;
        this.updatedAt = updatedAt;
        this.sourceName = sourceName;
    }

    public Long getId() {
        return id;
    }

    public String getHeroName() {
        return heroName;
    }

    public GamePlatform getPlatform() {
        return platform;
    }

    public GameChannel getChannel() {
        return channel;
    }

    public RegionLevel getRegionLevel() {
        return regionLevel;
    }

    public String getRegionName() {
        return regionName;
    }

    public Integer getPower() {
        return power;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public String getSourceName() {
        return sourceName;
    }
}
