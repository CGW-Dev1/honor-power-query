const app = getApp()

function request(path, data = {}) {
  return new Promise((resolve, reject) => {
    const url = `${app.globalData.apiBaseUrl}${path}`
    wx.request({
      url,
      data,
      method: "GET",
      timeout: 12000,
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data)
          return
        }

        const message = response.data && response.data.message ? response.data.message : "请求失败，请稍后重试"
        console.error("[request] bad status", url, response.statusCode, response.data)
        reject(new Error(message))
      },
      fail(error) {
        console.error("[request] failed", url, error)
        reject(new Error(error.errMsg || "网络连接失败，请检查服务地址"))
      }
    })
  })
}

module.exports = {
  request
}
