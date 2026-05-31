package com.example.honorpower.dto;

import com.example.honorpower.domain.GameChannel;
import com.example.honorpower.domain.GamePlatform;
import com.example.honorpower.domain.RegionLevel;

import java.time.LocalDateTime;
import java.util.List;

public record HeroPowerQueryResponse(
        String heroName,
        GamePlatform platform,
        String platformLabel,
        GameChannel channel,
        String channelLabel,
        LocalDateTime updatedAt,
        String sourceName,
        String sourceType,
        String notice,
        List<PowerRanking> rankings
) {
    public record PowerRanking(
            RegionLevel level,
            String levelLabel,
            String regionName,
            Integer power,
            List<Placement> placements
    ) {
    }

    public record Placement(
            Integer rank,
            String regionName,
            Integer power
    ) {
    }
}
