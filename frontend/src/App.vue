<script setup>
import { computed, onMounted, ref } from 'vue'
import { getOptions, queryPower, searchHeroes } from './api'

const options = ref({ platforms: [], channels: [] })
const heroes = ref([])
const keyword = ref('')
const selectedHero = ref('')
const platform = ref('ANDROID')
const channel = ref('WECHAT')
const provider = ref('wzryqz')
const result = ref(null)
const selectedRanking = ref(null)
const loading = ref(false)
const error = ref('')

const hasResult = computed(() => result.value && result.value.rankings?.length)
const currentHero = computed(() => heroes.value.find((hero) => hero.name === selectedHero.value))

onMounted(async () => {
  try {
    const [optionData, heroData] = await Promise.all([getOptions(), searchHeroes()])
    options.value = optionData
    heroes.value = heroData
    selectedHero.value = heroData.find((hero) => hero.name === '李白')?.name || heroData[0]?.name || ''
  } catch (exception) {
    error.value = exception.message
  }
})

let searchTimer
function onKeywordInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    try {
      heroes.value = await searchHeroes(keyword.value)
      if (!heroes.value.some((hero) => hero.name === selectedHero.value)) {
        selectedHero.value = heroes.value[0]?.name || ''
      }
    } catch (exception) {
      error.value = exception.message
    }
  }, 180)
}

async function submitQuery() {
  if (!selectedHero.value) {
    error.value = '请先选择一个英雄'
    return
  }

  loading.value = true
  error.value = ''
  try {
    result.value = await queryPower({
      heroName: selectedHero.value,
      platform: platform.value,
      channel: channel.value,
      provider: provider.value
    })
    selectedRanking.value = null
  } catch (exception) {
    result.value = null
    error.value = exception.message
  } finally {
    loading.value = false
  }
}

function formatTime(value) {
  if (!value) return '--'
  return value.replace('T', ' ')
}

function openRanking(item) {
  selectedRanking.value = item
}

function closeRanking() {
  selectedRanking.value = null
}
</script>

<template>
  <main class="page-shell">
    <div class="sakura-branch sakura-branch-top" aria-hidden="true"></div>
    <div class="sakura-branch sakura-branch-bottom" aria-hidden="true"></div>
    <div class="falling-petals" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
    <section class="dashboard">
      <header class="topbar">
        <div class="brand">
          <span class="brand-mark">樱</span>
          <div>
            <strong>王者荣耀英雄战力查询</strong>
            <small>县标 / 市标 / 省标 / 小国标最低战力 · 樱花版</small>
          </div>
        </div>
        <span class="status"><i></i> 实时供应商查询</span>
      </header>

      <section class="hero-strip">
        <div>
          <p class="eyebrow">SAKURA POWER INDEX</p>
          <h1>全英雄最低战力查询</h1>
          <p>选择接口、英雄和分区后查询。点击任意标卡可看前 10 个低分位置。</p>
        </div>
        <div class="hero-stats">
          <div><b>{{ heroes.length || 130 }}</b><span>英雄</span></div>
          <div><b>4</b><span>榜单等级</span></div>
          <div><b>4</b><span>平台分区</span></div>
        </div>
      </section>

      <form class="query-card" @submit.prevent="submitQuery">
          <div class="section-heading">
            <p>QUERY PANEL</p>
            <h2>查询条件</h2>
          </div>

          <label class="field">
            <span>搜索英雄</span>
            <input
              v-model="keyword"
              type="search"
              placeholder="输入英雄名称筛选"
              @input="onKeywordInput"
            />
          </label>

          <label class="field">
            <span>选择英雄</span>
            <select v-model="selectedHero">
              <option value="" disabled>请选择英雄</option>
              <option v-for="hero in heroes" :key="hero.name" :value="hero.name">
                {{ hero.name }} - {{ hero.title }}
              </option>
            </select>
          </label>

          <label class="field compact-field">
            <span>系统</span>
            <select v-model="platform">
              <option v-for="item in options.platforms" :key="item.value" :value="item.value">
                {{ item.label }}
              </option>
            </select>
          </label>

          <label class="field compact-field">
            <span>分区</span>
            <select v-model="channel">
              <option v-for="item in options.channels" :key="item.value" :value="item.value">
                {{ item.label }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>数据接口</span>
            <select v-model="provider">
              <option v-for="item in options.providers" :key="item.value" :value="item.value">
                {{ item.label }}
              </option>
            </select>
          </label>

          <div v-if="currentHero" class="hero-preview">
            <img :src="currentHero.iconUrl" :alt="currentHero.name" />
            <div>
              <b>{{ currentHero.name }}</b>
              <span>{{ currentHero.title }}</span>
            </div>
          </div>

          <button class="query-button" :disabled="loading" type="submit">
            {{ loading ? '查询中...' : '查询最低战力' }}
          </button>

          <p v-if="error" class="message error-message">{{ error }}</p>
        </form>

      <section class="workspace">
        <section class="results-panel">
          <div v-if="hasResult" class="results">
            <div class="result-title">
              <div>
                <p>POWER SNAPSHOT</p>
                <h2>{{ result.heroName }} · 最低战力</h2>
              </div>
              <div class="result-meta">
                <b>{{ result.platformLabel }} / {{ result.channelLabel }}</b>
                <span>更新时间：{{ formatTime(result.updatedAt) }}</span>
                <span>来源：{{ result.sourceName }}</span>
              </div>
            </div>

            <div class="ranking-grid">
              <article
                v-for="(item, index) in result.rankings"
                :key="item.level"
                class="ranking-card"
                tabindex="0"
                role="button"
                @click="openRanking(item)"
                @keyup.enter="openRanking(item)"
              >
                <span class="rank-number">0{{ index + 1 }}</span>
                <p>{{ item.levelLabel }}</p>
                <h3>{{ item.power.toLocaleString() }}</h3>
                <div><span>{{ item.regionName }}</span><b>点击查看前10低分位置</b></div>
              </article>
            </div>

            <p class="notice">{{ result.notice }}</p>
          </div>

          <div v-else class="empty-state">
            <div class="empty-icon">+</div>
            <h3>选择英雄后开始查询</h3>
            <p>结果会展示县标、市标、省标和小国标最低战力。</p>
          </div>
        </section>
      </section>
    </section>

    <div v-if="selectedRanking" class="detail-mask" @click.self="closeRanking">
      <section class="detail-panel">
        <button class="close-button" type="button" @click="closeRanking">关闭</button>
        <p class="eyebrow">LOWEST TOP 10</p>
        <h2>{{ result.heroName }} · {{ selectedRanking.levelLabel }}</h2>
        <div class="detail-list">
          <div v-for="item in selectedRanking.placements" :key="`${item.rank}-${item.regionName}`" class="detail-row">
            <b>#{{ item.rank }}</b>
            <span>{{ item.regionName }}</span>
            <strong>{{ item.power.toLocaleString() }}</strong>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
