async function request(url) {
  const response = await fetch(url)
  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(body.message || '请求失败，请稍后重试')
  }

  return body
}

export function getOptions() {
  return request('/api/options')
}

export function searchHeroes(keyword = '') {
  return request(`/api/heroes?keyword=${encodeURIComponent(keyword)}`)
}

export function queryPower({ heroName, platform, channel, provider }) {
  const params = new URLSearchParams({ heroName, platform, channel, provider })
  return request(`/api/power/query?${params.toString()}`)
}
