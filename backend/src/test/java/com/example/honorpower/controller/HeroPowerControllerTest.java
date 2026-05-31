package com.example.honorpower.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class HeroPowerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void returnsPowerRankingsForKnownHero() throws Exception {
        mockMvc.perform(get("/api/power/query")
                        .param("heroName", "李白")
                        .param("platform", "ANDROID")
                        .param("channel", "WECHAT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.heroName").value("李白"))
                .andExpect(jsonPath("$.platformLabel").value("Android"))
                .andExpect(jsonPath("$.channelLabel").value("微信区"))
                .andExpect(jsonPath("$.sourceType").value("CACHE"))
                .andExpect(jsonPath("$.rankings", hasSize(5)))
                .andExpect(jsonPath("$.rankings[0].level").value("DISTRICT"))
                .andExpect(jsonPath("$.rankings[0].levelLabel").value("县标"))
                .andExpect(jsonPath("$.rankings[0].power").value(4200))
                .andExpect(jsonPath("$.rankings[3].level").value("NATIONAL_TOP100"))
                .andExpect(jsonPath("$.rankings[4].level").value("NATIONAL_TOP10"));
    }

    @Test
    void searchesHeroesByKeyword() throws Exception {
        mockMvc.perform(get("/api/heroes").param("keyword", "李白"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("李白"));
    }

    @Test
    void returnsNotFoundForUnknownHero() throws Exception {
        mockMvc.perform(get("/api/power/query")
                        .param("heroName", "不存在")
                        .param("platform", "IOS")
                        .param("channel", "QQ"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("暂无该英雄在当前分区的战力数据"));
    }
}
