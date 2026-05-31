const { request } = require("../../utils/request")

Page({
  data: {
    loading: false,
    initialized: false,
    keyword: "",
    heroes: [],
    heroNames: [],
    selectedHeroIndex: 0,
    selectedHero: null,
    platforms: [],
    platformIndex: 0,
    channels: [],
    channelIndex: 0,
    providers: [],
    providerIndex: 0,
    result: null,
    activeRanking: null,
    lastQueryText: "选择英雄后，一键查询县标、市标、省标、小国标、大国标"
  },

  getProviderDisplayName(index) {
    const names = ["渠道一", "渠道二", "渠道三", "渠道四"]
    return names[index] || `渠道${index + 1}`
  },

  onLoad() {
    this.initialize()
  },

  onPullDownRefresh() {
    this.initialize().finally(() => wx.stopPullDownRefresh())
  },

  async initialize() {
    wx.showNavigationBarLoading()
    try {
      const [options, heroes] = await Promise.all([
        request("/api/options"),
        request("/api/heroes")
      ])
      const selectedHeroIndex = Math.max(heroes.findIndex((hero) => hero.name === "李白"), 0)
      this.setData({
        initialized: true,
        platforms: options.platforms || [],
        channels: options.channels || [],
        providers: (options.providers || []).map((provider, index) => ({
          ...provider,
          displayName: this.getProviderDisplayName(index),
          displayDesc: index === 0 ? "推荐优先，更新较快" : "备用查询，结果互补"
        })),
        heroes,
        heroNames: heroes.map((hero) => `${hero.name} - ${hero.title}`),
        selectedHeroIndex,
        selectedHero: heroes[selectedHeroIndex] || null
      })
    } catch (error) {
      this.showError(error)
    } finally {
      wx.hideNavigationBarLoading()
    }
  },

  onKeywordInput(event) {
    this.setData({ keyword: event.detail.value })
  },

  async searchHeroes() {
    try {
      const heroes = await request("/api/heroes", { keyword: this.data.keyword })
      this.setData({
        heroes,
        heroNames: heroes.map((hero) => `${hero.name} - ${hero.title}`),
        selectedHeroIndex: 0,
        selectedHero: heroes[0] || null
      })
    } catch (error) {
      this.showError(error)
    }
  },

  clearKeyword() {
    this.setData({ keyword: "" })
    this.searchHeroes()
  },

  onHeroChange(event) {
    const selectedHeroIndex = Number(event.detail.value)
    this.setData({
      selectedHeroIndex,
      selectedHero: this.data.heroes[selectedHeroIndex]
    })
  },

  selectHero(event) {
    const selectedHeroIndex = Number(event.currentTarget.dataset.index)
    this.setData({
      selectedHeroIndex,
      selectedHero: this.data.heroes[selectedHeroIndex]
    })
  },

  onPlatformChange(event) {
    this.setData({ platformIndex: Number(event.detail.value) })
  },

  selectPlatform(event) {
    this.setData({ platformIndex: Number(event.currentTarget.dataset.index) })
  },

  onChannelChange(event) {
    this.setData({ channelIndex: Number(event.detail.value) })
  },

  selectChannel(event) {
    this.setData({ channelIndex: Number(event.currentTarget.dataset.index) })
  },

  onProviderChange(event) {
    this.setData({ providerIndex: Number(event.detail.value) })
  },

  selectProvider(event) {
    this.setData({ providerIndex: Number(event.currentTarget.dataset.index) })
  },

  async submitQuery() {
    const { selectedHero, platforms, platformIndex, channels, channelIndex, providers, providerIndex } = this.data
    if (!selectedHero) {
      wx.showToast({ title: "请先选择英雄", icon: "none" })
      return
    }

    this.setData({ loading: true })
    try {
      const result = await request("/api/power/query", {
        heroName: selectedHero.name,
        platform: platforms[platformIndex].value,
        channel: channels[channelIndex].value,
        provider: providers[providerIndex].value
      })
      this.setData({
        result,
        lastQueryText: `${result.heroName} · ${result.platformLabel}/${result.channelLabel} · ${providers[providerIndex].displayName}`
      })
    } catch (error) {
      this.showError(error)
    } finally {
      this.setData({ loading: false })
    }
  },

  openRanking(event) {
    const index = Number(event.currentTarget.dataset.index)
    this.setData({ activeRanking: this.data.result.rankings[index] })
  },

  closeRanking() {
    this.setData({ activeRanking: null })
  },

  noop() {},

  showError(error) {
    wx.showToast({
      title: error.message || "请求失败，请稍后重试",
      icon: "none",
      duration: 2600
    })
  }
})
