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
const hasResult = computed(() => result.value?.rankings?.length)
const resultMode = computed(() => (result.value?.sourceType === 'OFFLINE' ? '离线兜底' : '实时聚合'))
const heroCountText = computed(() => `${heroes.value.length || 130} 位英雄`)

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

function selectHero(hero) {
  selectedHero.value = hero.name
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
    <section class="hero-panel">
      <div class="top-row">
        <div class="brand">
          <span class="brand-mark">战</span>
          <div>
            <strong>王者战力查询</strong>
            <small>无后端 APK 版</small>
          </div>
        </div>
        <span class="live-pill"><i></i>{{ resultMode }}</span>
      </div>

      <div class="headline">
        <p>Honor Power Index</p>
        <h1>最低上榜战力，一次看清</h1>
        <span>县标 / 市标 / 省标 / 小国标 / 大国标，安装后即可查询。</span>
      </div>

      <div class="hero-summary" v-if="currentHero">
        <img :src="currentHero.iconUrl" :alt="currentHero.name" />
        <div>
          <span>当前英雄</span>
          <b>{{ currentHero.name }}</b>
          <small>{{ currentHero.title }}</small>
        </div>
        <em>{{ heroCountText }}</em>
      </div>
    </section>

    <section class="search-card">
      <label class="search-box">
        <span>搜</span>
        <input
          v-model="keyword"
          type="search"
          placeholder="搜索英雄，如 李白、孙悟空"
          @input="onKeywordInput"
        />
      </label>

      <div class="hero-chips" v-if="heroes.length">
        <button
          v-for="hero in heroes.slice(0, 12)"
          :key="hero.name"
          :class="{ active: hero.name === selectedHero }"
          type="button"
          @click="selectHero(hero)"
        >
          {{ hero.name }}
        </button>
      </div>

      <label class="select-line">
        <span>选择英雄</span>
        <select v-model="selectedHero">
          <option value="" disabled>请选择英雄</option>
          <option v-for="hero in heroes" :key="hero.name" :value="hero.name">
            {{ hero.name }} - {{ hero.title }}
          </option>
        </select>
      </label>
    </section>

    <section class="control-card">
      <div class="step">
        <span>01 系统</span>
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

      <div class="step">
        <span>02 区服</span>
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

      <div class="step">
        <span>03 查询渠道</span>
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
        {{ loading ? '正在查询...' : '查询最低战力' }}
      </button>

      <p v-if="error" class="error-message">{{ error }}</p>
    </section>

    <section class="result-card" v-if="hasResult">
      <div class="result-head">
        <div>
          <span>查询结果</span>
          <h2>{{ result.heroName }} · 最低战力</h2>
        </div>
        <strong>{{ result.platformLabel }} / {{ result.channelLabel }}</strong>
      </div>

      <div class="meta-row">
        <span>更新：{{ formatTime(result.updatedAt) }}</span>
        <span>{{ result.sourceName }}</span>
      </div>

      <div class="ranking-grid">
        <article
          v-for="item in result.rankings"
          :key="item.level"
          class="ranking-card"
          tabindex="0"
          role="button"
          @click="openRanking(item)"
          @keyup.enter="openRanking(item)"
        >
          <span class="card-label">{{ item.levelLabel }}</span>
          <b>{{ item.power.toLocaleString() }}</b>
          <strong>{{ item.regionName }}</strong>
          <small>点击查看低分位置</small>
        </article>
      </div>

      <p class="notice">{{ result.notice }}</p>
    </section>

    <section class="empty-card" v-else>
      <div>查</div>
      <h2>选择英雄后开始查询</h2>
      <p>应用已内置英雄库，不需要启动电脑后端服务。</p>
    </section>

    <div v-if="selectedRanking" class="sheet-mask" @click.self="closeRanking">
      <section class="bottom-sheet">
        <i></i>
        <button type="button" @click="closeRanking">关闭</button>
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
