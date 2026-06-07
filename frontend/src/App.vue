<script setup>
import { computed, onMounted, ref } from 'vue'
import { getOptions, queryPower, searchHeroes } from './api'

const options = ref({ platforms: [], channels: [], providers: [] })
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

const currentHero = computed(() => heroes.value.find((hero) => hero.name === selectedHero.value))
const hasResult = computed(() => result.value?.rankings?.length > 0)
const heroCountText = computed(() => `${heroes.value.length || 130} 位英雄`)
const resultMode = computed(() => (result.value?.sourceType === 'OFFLINE' ? '参考结果' : '实时查询'))
const currentPlatformLabel = computed(() => options.value.platforms.find((item) => item.value === platform.value)?.label || 'Android')
const currentChannelLabel = computed(() => options.value.channels.find((item) => item.value === channel.value)?.label || '微信区')
const currentProvider = computed(() => options.value.providers.find((item) => item.value === provider.value))
const lowestRanking = computed(() => result.value?.rankings?.[0])
const featuredRankings = computed(() => result.value?.rankings?.slice(0, 5) || [])

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
    heroes.value = await searchHeroes(keyword.value)
    if (!heroes.value.some((hero) => hero.name === selectedHero.value)) {
      selectedHero.value = heroes.value[0]?.name || ''
    }
  }, 120)
}

function selectHero(hero) {
  selectedHero.value = hero.name
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
  return value ? String(value).replace('T', ' ') : '--'
}

function openRanking(item) {
  selectedRanking.value = item
}

function closeRanking() {
  selectedRanking.value = null
}
</script>

<template>
  <main class="app-shell">
    <section class="hero-stage">
      <div class="app-top">
        <div class="brand-lockup">
          <span>W</span>
          <div>
            <strong>王者战力查询</strong>
            <small>县标 / 市标 / 省标 / 国标</small>
          </div>
        </div>
        <div class="status-chip">
          <i></i>
          {{ resultMode }}
        </div>
      </div>

      <div class="hero-identity" v-if="currentHero">
        <div class="hero-avatar-wrap">
          <img :src="currentHero.iconUrl" :alt="currentHero.name" />
        </div>
        <div class="hero-copy">
          <p>当前英雄</p>
          <h1>{{ currentHero.name }}</h1>
          <span>{{ currentHero.title }}</span>
        </div>
      </div>

      <div class="query-tags">
        <span>{{ currentPlatformLabel }}</span>
        <span>{{ currentChannelLabel }}</span>
        <span>{{ currentProvider?.label || '渠道一' }}</span>
        <span>{{ heroCountText }}</span>
      </div>

      <div class="power-hero" v-if="hasResult && lowestRanking">
        <div>
          <p>最低上榜战力</p>
          <strong>{{ lowestRanking.power.toLocaleString() }}</strong>
          <span>{{ lowestRanking.levelLabel }} · {{ lowestRanking.regionName }}</span>
        </div>
        <button type="button" @click="openRanking(lowestRanking)">看位置</button>
      </div>

      <div class="power-hero empty" v-else>
        <div>
          <p>一键查询</p>
          <strong>五档榜单</strong>
          <span>选择英雄和区服后查看最低位置</span>
        </div>
      </div>
    </section>

    <section class="panel search-panel">
      <div class="section-title">
        <span>01</span>
        <div>
          <h2>选择英雄</h2>
          <p>支持英雄名和称号搜索</p>
        </div>
      </div>

      <label class="search-box">
        <b>搜</b>
        <input
          v-model="keyword"
          type="search"
          placeholder="搜索英雄，如 李白、孙悟空"
          @input="onKeywordInput"
        />
      </label>

      <div class="hero-chips" v-if="heroes.length">
        <button
          v-for="hero in heroes.slice(0, 14)"
          :key="hero.name"
          :class="{ active: hero.name === selectedHero }"
          type="button"
          @click="selectHero(hero)"
        >
          {{ hero.name }}
        </button>
      </div>

      <label class="select-field">
        <span>完整英雄列表</span>
        <select v-model="selectedHero">
          <option value="" disabled>请选择英雄</option>
          <option v-for="hero in heroes" :key="hero.name" :value="hero.name">
            {{ hero.name }} - {{ hero.title }}
          </option>
        </select>
      </label>
    </section>

    <section class="panel filter-panel">
      <div class="section-title">
        <span>02</span>
        <div>
          <h2>查询条件</h2>
          <p>系统、区服和查询渠道</p>
        </div>
      </div>

      <div class="control-group">
        <label>操作系统</label>
        <div class="segmented">
          <button
            v-for="item in options.platforms"
            :key="item.value"
            :class="{ active: item.value === platform }"
            type="button"
            @click="platform = item.value"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div class="control-group">
        <label>游戏区服</label>
        <div class="segmented">
          <button
            v-for="item in options.channels"
            :key="item.value"
            :class="{ active: item.value === channel }"
            type="button"
            @click="channel = item.value"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div class="control-group">
        <label>查询渠道</label>
        <div class="provider-list">
          <button
            v-for="item in options.providers"
            :key="item.value"
            :class="{ active: item.value === provider }"
            type="button"
            @click="provider = item.value"
          >
            <b>{{ item.label }}</b>
            <small>{{ item.description }}</small>
          </button>
        </div>
      </div>

      <button class="primary-button" :disabled="loading" type="button" @click="submitQuery">
        <span>{{ loading ? '正在查询...' : '查询最低战力' }}</span>
      </button>

      <p v-if="error" class="error-message">{{ error }}</p>
    </section>

    <section class="panel result-panel" v-if="hasResult">
      <div class="result-head">
        <div>
          <p>POWER SNAPSHOT</p>
          <h2>{{ result.heroName }} · 最低战力</h2>
          <span>更新：{{ formatTime(result.updatedAt) }}</span>
        </div>
        <strong>{{ result.platformLabel }} / {{ result.channelLabel }}</strong>
      </div>

      <div class="ranking-grid">
        <article
          v-for="(item, index) in featuredRankings"
          :key="item.level"
          class="ranking-card"
          tabindex="0"
          role="button"
          @click="openRanking(item)"
          @keyup.enter="openRanking(item)"
        >
          <em>0{{ index + 1 }}</em>
          <span>{{ item.levelLabel }}</span>
          <b>{{ item.power.toLocaleString() }}</b>
          <strong>{{ item.regionName }}</strong>
          <small>点击查看低分位置</small>
        </article>
      </div>

      <div class="source-note">
        <span>{{ result.sourceName }}</span>
        <p>{{ result.notice }}</p>
      </div>
    </section>

    <section class="panel empty-panel" v-else>
      <div class="empty-mark">榜</div>
      <h2>等待查询</h2>
      <p>完成英雄、系统和区服选择后，结果会展示县标、市标、省标、小国标和大国标。</p>
    </section>

    <div v-if="selectedRanking" class="sheet-mask" @click.self="closeRanking">
      <section class="bottom-sheet">
        <div class="sheet-handle"></div>
        <button class="sheet-close" type="button" @click="closeRanking">关闭</button>
        <p>LOWEST POSITIONS</p>
        <h2>{{ result.heroName }} · {{ selectedRanking.levelLabel }}</h2>
        <div class="placement-list">
          <div
            v-for="item in selectedRanking.placements"
            :key="`${item.rank}-${item.regionName}`"
            class="placement-row"
          >
            <b>#{{ item.rank }}</b>
            <span>{{ item.regionName }}</span>
            <strong>{{ item.power.toLocaleString() }}</strong>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
