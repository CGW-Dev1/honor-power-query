const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

function resolveUrl(url) {
  if (/^https?:\/\//i.test(url)) {
    return url
  }

  return API_BASE_URL ? `${API_BASE_URL}${url}` : url
}

async function request(url) {
  const response = await fetch(resolveUrl(url))
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
