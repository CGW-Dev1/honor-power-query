import { CapacitorHttp } from '@capacitor/core'
import builtinHeroes from './data/heroes.json'

const HERO_LIST_URL = 'https://pvp.qq.com/web201605/js/herolist.json'
const CACHE_KEY = 'honor-power-heroes-v2'

const PLATFORMS = [
  { value: 'ANDROID', label: 'Android' },
  { value: 'IOS', label: 'iOS' }
]

const CHANNELS = [
  { value: 'WECHAT', label: '微信区' },
  { value: 'QQ', label: 'QQ区' }
]

const PROVIDERS = [
  { value: 'wzryqz', label: '渠道一', description: '推荐优先，含前 10 低分位置' },
  { value: 'xxoo', label: '渠道二', description: '备用查询，结果互补' }
]

const LEVELS = {
  DISTRICT: { label: '县标', order: 1 },
  CITY: { label: '市标', order: 2 },
  PROVINCE: { label: '省标', order: 3 },
  NATIONAL_TOP100: { label: '小国标', order: 4 },
  NATIONAL_TOP10: { label: '大国标', order: 5 }
}

function normalizeHeroes(items) {
  return items
    .map((item) => ({
      id: Number(item.id ?? item.ename),
      name: item.name ?? item.cname,
      title: item.title || '',
      role: Number(item.role ?? item.hero_type ?? 0),
      iconUrl:
        item.iconUrl ||
        `https://game.gtimg.cn/images/yxzj/img201606/heroimg/${item.ename}/${item.ename}.jpg`
    }))
    .filter((item) => item.id && item.name)
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))
}

async function getJson(url, params = {}) {
  const response = await CapacitorHttp.get({
    url,
    params,
    readTimeout: 15000,
    connectTimeout: 15000
  })

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`请求失败：${response.status}`)
  }

  return typeof response.data === 'string' ? JSON.parse(response.data) : response.data
}

function providerType(platform, channel) {
  if (platform === 'ANDROID' && channel === 'QQ') return 'aqq'
  if (platform === 'ANDROID' && channel === 'WECHAT') return 'awx'
  if (platform === 'IOS' && channel === 'QQ') return 'iqq'
  return 'iwx'
}

function labels(platform, channel) {
  return {
    platformLabel: PLATFORMS.find((item) => item.value === platform)?.label || platform,
    channelLabel: CHANNELS.find((item) => item.value === channel)?.label || channel
  }
}

function toNumber(value) {
  const parsed = Number.parseInt(String(value || '').replace(/[^\d]/g, ''), 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function rankingFromRows(level, rows) {
  const placements = Array.isArray(rows)
    ? rows.slice(0, 10).map((row, index) => ({
        rank: index + 1,
        regionName: row.loc || row.regionName || '未知位置',
        power: toNumber(row.val ?? row.power)
      }))
    : []

  const first = placements[0] || { regionName: '暂无数据', power: 0 }
  return {
    level,
    levelLabel: LEVELS[level].label,
    regionName: first.regionName,
    power: first.power,
    placements
  }
}

function singleRanking(level, regionName, power, rank = 1) {
  const value = toNumber(power)
  return {
    level,
    levelLabel: LEVELS[level].label,
    regionName,
    power: value,
    placements: value ? [{ rank, regionName, power: value }] : []
  }
}

function parseWzryqz(root, heroName, platform, channel) {
  if (!root || root.code !== 200 || !root.data) {
    throw new Error('渠道一暂时没有返回该英雄的数据')
  }

  const data = root.data
  const rankings = [
    rankingFromRows('DISTRICT', data.county),
    rankingFromRows('CITY', data.city),
    rankingFromRows('PROVINCE', data.province),
    singleRanking('NATIONAL_TOP100', '全国榜第 100 名', data.Top100, 100),
    singleRanking('NATIONAL_TOP10', '全国榜第 10 名', data.Top10, 10)
  ].filter((item) => item.power > 0)

  if (!rankings.length) {
    throw new Error('渠道一返回为空，请稍后再试')
  }

  return buildResponse({
    heroName: data.name || heroName,
    platform,
    channel,
    rankings,
    updatedAt: data.updatetime,
    sourceName: '渠道一实时聚合'
  })
}

function parseXxoo(root, heroName, platform, channel) {
  if (!root || root.code !== 200 || !root.data) {
    throw new Error('渠道二暂时没有返回该英雄的数据')
  }

  const data = root.data
  const rankings = [
    singleRanking('DISTRICT', data.area || '未知区县', data.areaPower),
    singleRanking('CITY', data.city || '未知城市', data.cityPower),
    singleRanking('PROVINCE', data.province || '未知省份', data.provincePower),
    singleRanking('NATIONAL_TOP100', '全国榜第 100 名', data.guobiao, 100)
  ].filter((item) => item.power > 0)

  if (!rankings.length) {
    throw new Error('渠道二返回为空，请稍后再试')
  }

  return buildResponse({
    heroName: data.name || heroName,
    platform,
    channel,
    rankings,
    updatedAt: data.updatetime,
    sourceName: '渠道二备用聚合'
  })
}

function buildResponse({ heroName, platform, channel, rankings, updatedAt, sourceName, sourceType = 'LIVE' }) {
  const display = labels(platform, channel)
  return {
    heroName,
    platform,
    channel,
    ...display,
    updatedAt: updatedAt || new Date().toISOString().slice(0, 19).replace('T', ' '),
    sourceName,
    sourceType,
    notice:
      sourceType === 'OFFLINE'
        ? '当前为离线演示数据，仅用于无网络或接口不可用时保持应用可操作；真实战力请联网后重新查询。'
        : '战力数据来自第三方聚合接口，不是腾讯官方开放 API；点击卡片可查看前 10 个低分位置。',
    rankings: rankings.sort((a, b) => LEVELS[a.level].order - LEVELS[b.level].order)
  }
}

function seededNumber(text, min, max) {
  let hash = 0
  for (const char of text) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return min + (hash % (max - min + 1))
}

function offlineResponse(heroName, platform, channel) {
  const seed = `${heroName}-${platform}-${channel}`
  const regions = ['青海省', '宁夏回族自治区', '黑龙江省', '甘肃省', '新疆维吾尔自治区']
  const districtBase = seededNumber(seed, 900, 1800)
  const cityBase = seededNumber(seed, 3900, 6200)
  const provinceBase = seededNumber(seed, 7600, 9800)
  const top100 = seededNumber(seed, 11800, 14500)
  const top10 = top100 + seededNumber(seed, 900, 2200)

  function placements(prefix, base, count = 10) {
    return Array.from({ length: count }, (_, index) => ({
      rank: index + 1,
      regionName: `${regions[index % regions.length]}${prefix}${index + 1}`,
      power: base + index * seededNumber(`${seed}-${prefix}-${index}`, 8, 55)
    }))
  }

  return buildResponse({
    heroName,
    platform,
    channel,
    sourceType: 'OFFLINE',
    sourceName: '离线演示数据',
    rankings: [
      { level: 'DISTRICT', levelLabel: '县标', regionName: '离线区县最低位', power: districtBase, placements: placements('低分区', districtBase) },
      { level: 'CITY', levelLabel: '市标', regionName: '离线城市最低位', power: cityBase, placements: placements('低分市', cityBase) },
      { level: 'PROVINCE', levelLabel: '省标', regionName: '离线省份最低位', power: provinceBase, placements: placements('低分省', provinceBase) },
      { level: 'NATIONAL_TOP100', levelLabel: '小国标', regionName: '全国榜第 100 名', power: top100, placements: [{ rank: 100, regionName: '全国榜第 100 名', power: top100 }] },
      { level: 'NATIONAL_TOP10', levelLabel: '大国标', regionName: '全国榜第 10 名', power: top10, placements: [{ rank: 10, regionName: '全国榜第 10 名', power: top10 }] }
    ]
  })
}

export async function getOptions() {
  return {
    platforms: PLATFORMS,
    channels: CHANNELS,
    providers: PROVIDERS
  }
}

export async function searchHeroes(keyword = '') {
  let heroes = builtinHeroes
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    try {
      heroes = normalizeHeroes(JSON.parse(cached))
    } catch {
      localStorage.removeItem(CACHE_KEY)
    }
  }

  if (!cached) {
    getJson(HERO_LIST_URL)
      .then((items) => localStorage.setItem(CACHE_KEY, JSON.stringify(normalizeHeroes(items))))
      .catch(() => {})
  }

  const normalized = keyword.trim().toLowerCase()
  return heroes.filter(
    (hero) =>
      !normalized ||
      hero.name.toLowerCase().includes(normalized) ||
      hero.title.toLowerCase().includes(normalized)
  )
}

export async function queryPower({ heroName, platform, channel, provider }) {
  try {
    const type = providerType(platform, channel)
    if (provider === 'xxoo') {
      const root = await getJson('https://api.xxoo.team/hero/getHeroInfo.php', { hero: heroName, type })
      return parseXxoo(root, heroName, platform, channel)
    }

    const root = await getJson('https://api.wzryqz.cn/gethero', { hero: heroName, type })
    return parseWzryqz(root, heroName, platform, channel)
  } catch (error) {
    console.warn('[offline fallback]', error)
    return offlineResponse(heroName, platform, channel)
  }
}
