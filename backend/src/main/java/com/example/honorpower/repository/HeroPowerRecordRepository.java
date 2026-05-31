package com.example.honorpower.repository;

import com.example.honorpower.domain.GameChannel;
import com.example.honorpower.domain.GamePlatform;
import com.example.honorpower.domain.HeroPowerRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HeroPowerRecordRepository extends JpaRepository<HeroPowerRecord, Long> {

    List<HeroPowerRecord> findByHeroNameAndPlatformAndChannel(
            String heroName,
            GamePlatform platform,
            GameChannel channel
    );

    void deleteByHeroNameAndPlatformAndChannel(
            String heroName,
            GamePlatform platform,
            GameChannel channel
    );

    @Query("""
            select distinct r.heroName
            from HeroPowerRecord r
            where :keyword = '' or lower(r.heroName) like lower(concat('%', :keyword, '%'))
            order by r.heroName
            """)
    List<String> findHeroNames(@Param("keyword") String keyword);
}
