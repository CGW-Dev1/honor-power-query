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
const featuredRankings = computed(() => result.value?.rankings?.slice(0, 5) || [])

let searchTimer
let queryTimer
let querySerial = 0

onMounted(async () => {
  try {
    const [optionData, heroData] = await Promise.all([getOptions(), searchHeroes()])
    options.value = optionData
    heroes.value = heroData
    selectedHero.value = heroData.find((hero) => hero.name === '李白')?.name || heroData[0]?.name || ''
    if (selectedHero.value) {
      queueQuery()
    }
  } catch (exception) {
    error.value = exception.message
  }
})

function onKeywordInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    heroes.value = await searchHeroes(keyword.value)
    if (!heroes.value.some((hero) => hero.name === selectedHero.value)) {
      selectedHero.value = heroes.value[0]?.name || ''
    }
  }, 120)
}

function queueQuery() {
  clearTimeout(queryTimer)
  queryTimer = setTimeout(() => {
    submitQuery()
  }, 80)
}

function selectHero(hero) {
  if (!hero?.name) return
  if (selectedHero.value === hero.name && (loading.value || hasResult.value)) return
  selectedHero.value = hero.name
  queueQuery()
}

function onHeroSelectChange() {
  queueQuery()
}

function selectPlatform(value) {
  if (platform.value === value) return
  platform.value = value
  queueQuery()
}

function selectChannel(value) {
  if (channel.value === value) return
  channel.value = value
  queueQuery()
}

function selectProvider(value) {
  if (provider.value === value) return
  provider.value = value
  queueQuery()
}

async function submitQuery() {
  if (!selectedHero.value) {
    error.value = '请先选择一个英雄'
    return
  }

  const requestId = ++querySerial
  const heroName = selectedHero.value
  loading.value = true
  error.value = ''
  try {
    const nextResult = await queryPower({
      heroName,
      platform: platform.value,
      channel: channel.value,
      provider: provider.value
    })

    if (requestId === querySerial) {
      result.value = nextResult
      selectedRanking.value = null
    }
  } catch (exception) {
    if (requestId === querySerial) {
      result.value = null
      error.value = exception.message
    }
  } finally {
    if (requestId === querySerial) {
      loading.value = false
    }
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

function rankCode(level) {
  return {
    DISTRICT: 'COUNTY',
    CITY: 'CITY',
    PROVINCE: 'PROV',
    NATIONAL_TOP100: 'TOP100',
    NATIONAL_TOP10: 'TOP10'
  }[level] || 'RANK'
}
</script>

<template>
  <main class="app-shell">
    <section class="arena-hero">
      <div class="grid-glow"></div>

      <div class="app-bar">
        <div class="brand-lockup">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 64 64" role="img">
              <path class="mark-shield" d="M32 7 51 15v14c0 13.8-7.5 22.8-19 28-11.5-5.2-19-14.2-19-28V15l19-8Z" />
              <path class="mark-crown" d="M18 24 24 14l8 9 8-9 6 10-5 7H23l-5-7Z" />
              <path class="mark-blade" d="M21 44 42 23l4 4-21 21h-8l4-4Z" />
              <path class="mark-cut" d="M39 42h12l-5 6H34l5-6Z" />
            </svg>
          </span>
          <div>
            <strong>王者战力查询</strong>
            <small>Honor Power Arena</small>
          </div>
        </div>
        <div class="live-chip" :class="{ syncing: loading }">
          <i></i>
          {{ loading ? '同步中' : resultMode }}
        </div>
      </div>

      <div class="hero-board">
        <div class="portrait-frame" v-if="currentHero">
          <img :src="currentHero.iconUrl" :alt="currentHero.name" />
        </div>
        <div class="hero-copy">
          <p>LOCKED HERO</p>
          <h1>{{ currentHero?.name || '选择英雄' }}</h1>
          <span>{{ currentHero?.title || '锁定英雄后开始查询最低战力' }}</span>
        </div>
      </div>

      <div class="arena-tags">
        <span>{{ currentPlatformLabel }}</span>
        <span>{{ currentChannelLabel }}</span>
        <span>{{ currentProvider?.label || '渠道一' }}</span>
        <span>{{ heroCountText }}</span>
      </div>

      <div class="power-carousel" v-if="hasResult">
        <article
          v-for="item in featuredRankings"
          :key="item.level"
          class="power-slide"
          tabindex="0"
          role="button"
          @click="openRanking(item)"
          @keyup.enter="openRanking(item)"
        >
          <div>
            <p>{{ rankCode(item.level) }}</p>
            <div class="power-value-row">
              <strong>{{ item.power.toLocaleString() }}</strong>
              <button type="button" @click.stop="openRanking(item)">查看点位</button>
            </div>
            <span>{{ item.levelLabel }} · {{ item.regionName }}</span>
          </div>
        </article>
      </div>

      <div class="power-carousel empty" v-else>
        <article class="power-slide">
          <div>
            <p>READY TO SCAN</p>
            <strong>{{ loading ? '同步中' : '五档战力' }}</strong>
            <span>选中英雄后自动查询县标、市标、省标、小国标和大国标</span>
          </div>
        </article>
      </div>

      <div class="swipe-hint" :class="{ visible: hasResult }" :aria-hidden="!hasResult">
        <span>左右滑动查看市标 / 省标 / 国标</span>
        <b>›</b>
      </div>
    </section>

    <section class="panel target-panel">
      <div class="panel-title">
        <span>01</span>
        <div>
          <p>TARGET SELECT</p>
          <h2>英雄检索</h2>
        </div>
      </div>

      <label class="search-command">
        <b>SEARCH</b>
        <input
          v-model="keyword"
          type="search"
          placeholder="搜索英雄，如 李白、孙悟空"
          @input="onKeywordInput"
          @keyup.enter="submitQuery"
        />
        <button type="button" :disabled="loading" @click="submitQuery">
          {{ loading ? '同步中' : '查询' }}
        </button>
      </label>

      <div class="hero-strip" v-if="heroes.length">
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
        <select v-model="selectedHero" @change="onHeroSelectChange">
          <option value="" disabled>请选择英雄</option>
          <option v-for="hero in heroes" :key="hero.name" :value="hero.name">
            {{ hero.name }} - {{ hero.title }}
          </option>
        </select>
      </label>
    </section>

    <section class="panel config-panel">
      <div class="panel-title">
        <span>02</span>
        <div>
          <p>MATCH PARAMS</p>
          <h2>战区参数</h2>
        </div>
      </div>

      <div class="control-block">
        <label>操作系统</label>
        <div class="segmented">
          <button
            v-for="item in options.platforms"
            :key="item.value"
            :class="{ active: item.value === platform }"
            type="button"
            @click="selectPlatform(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div class="control-block">
        <label>游戏区服</label>
        <div class="segmented">
          <button
            v-for="item in options.channels"
            :key="item.value"
            :class="{ active: item.value === channel }"
            type="button"
            @click="selectChannel(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div class="control-block">
        <label>查询渠道</label>
        <div class="provider-list">
          <button
            v-for="item in options.providers"
            :key="item.value"
            :class="{ active: item.value === provider }"
            type="button"
            @click="selectProvider(item.value)"
          >
            <b>{{ item.label }}</b>
            <small>{{ item.description }}</small>
          </button>
        </div>
      </div>

      <button class="primary-button" :disabled="loading" type="button" @click="submitQuery">
        <span>{{ loading ? '正在同步战力...' : '启动战力扫描' }}</span>
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
          :class="{ featured: index === 0 }"
          tabindex="0"
          role="button"
          @click="openRanking(item)"
          @keyup.enter="openRanking(item)"
        >
          <div class="rank-top">
            <span>{{ item.levelLabel }}</span>
            <em>{{ rankCode(item.level) }}</em>
          </div>
          <b>{{ item.power.toLocaleString() }}</b>
          <strong>{{ item.regionName }}</strong>
          <small>点击查看前 10 个低分位置</small>
        </article>
      </div>

      <div class="source-note">
        <span>{{ result.sourceName }}</span>
        <p>{{ result.notice }}</p>
      </div>
    </section>

    <section class="panel empty-panel" v-else>
      <div class="empty-mark">VS</div>
      <h2>等待战力扫描</h2>
      <p>选择英雄、系统、区服和渠道后，结果会展示县标、市标、省标、小国标和大国标。</p>
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
