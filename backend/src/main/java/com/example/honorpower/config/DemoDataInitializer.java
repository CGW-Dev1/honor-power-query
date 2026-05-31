package com.example.honorpower.config;

import com.example.honorpower.domain.GameChannel;
import com.example.honorpower.domain.GamePlatform;
import com.example.honorpower.domain.HeroPowerRecord;
import com.example.honorpower.domain.RegionLevel;
import com.example.honorpower.repository.HeroPowerRecordRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@ConditionalOnProperty(name = "app.demo-data-enabled", havingValue = "true", matchIfMissing = true)
public class DemoDataInitializer implements ApplicationRunner {

    private static final List<String> HEROES = List.of("李白", "孙悟空", "王昭君", "貂蝉", "韩信", "瑶");
    private final HeroPowerRecordRepository repository;

    public DemoDataInitializer(HeroPowerRecordRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (repository.count() > 0) {
            return;
        }

        LocalDateTime updatedAt = LocalDateTime.now().withSecond(0).withNano(0);
        List<HeroPowerRecord> records = new ArrayList<>();
        for (int heroIndex = 0; heroIndex < HEROES.size(); heroIndex++) {
            for (GamePlatform platform : GamePlatform.values()) {
                for (GameChannel channel : GameChannel.values()) {
                    int base = 4200 + heroIndex * 370
                            + (platform == GamePlatform.IOS ? 180 : 0)
                            + (channel == GameChannel.QQ ? 260 : 0);
                    records.add(record(HEROES.get(heroIndex), platform, channel, RegionLevel.DISTRICT,
                            "甘肃省兰州市红古区", base, updatedAt));
                    records.add(record(HEROES.get(heroIndex), platform, channel, RegionLevel.CITY,
                            "河南省鹤壁市", base + 1450, updatedAt));
                    records.add(record(HEROES.get(heroIndex), platform, channel, RegionLevel.PROVINCE,
                            "山西省", base + 3100, updatedAt));
                    records.add(record(HEROES.get(heroIndex), platform, channel, RegionLevel.NATIONAL_TOP100,
                            "全国榜第100名", base + 6200, updatedAt));
                    records.add(record(HEROES.get(heroIndex), platform, channel, RegionLevel.NATIONAL_TOP10,
                            "全国榜第10名", base + 8200, updatedAt));
                }
            }
        }
        repository.saveAll(records);
    }

    private HeroPowerRecord record(
            String heroName,
            GamePlatform platform,
            GameChannel channel,
            RegionLevel level,
            String regionName,
            int power,
            LocalDateTime updatedAt
    ) {
        return new HeroPowerRecord(heroName, platform, channel, level, regionName, power, updatedAt);
    }
}
