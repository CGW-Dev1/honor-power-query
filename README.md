# 王者荣耀英雄战力查询

基于 Spring Boot、Vue 3 和 MySQL 的英雄战力查询系统，支持桌面浏览器和移动端。

## 功能

- 英雄列表：启动时从王者荣耀官网 `herolist.json` 同步全英雄名称、称号和头像。
- 战力查询：默认调用可配置的第三方聚合接口查询实时/准实时战力。
- 数据接口：支持在页面选择推荐接口或备用接口。
- 查询范围：Android / iOS、微信区 / QQ 区。
- 榜单结果：县标、市标、省标、小国标、大国标。
- MySQL 缓存：每次成功查询后写入本地快照，便于后续扩展缓存兜底。

> 说明：腾讯没有公开面向开发者的“全英雄最低战区战力”官方 API。当前默认战力供应商为第三方聚合数据，页面会展示来源和更新时间。小国标按全国榜第 100 名战力展示，大国标按全国榜第 10 名战力展示。

## 目录结构

```text
honor-power-query/
├── backend/          Spring Boot API
├── frontend/         Vue 3 + Vite 页面
├── miniprogram/      原生微信小程序
└── docker-compose.yml
```

## 启动 MySQL

```powershell
docker compose up -d
```

默认数据库配置：

| 配置 | 默认值 |
| --- | --- |
| 地址 | `localhost:3306` |
| 数据库 | `honor_power` |
| 用户名 | `honor` |
| 密码 | `honor123` |

## 启动后端

```powershell
cd backend
mvn spring-boot:run
```

后端默认运行在 `http://localhost:8080`。

常用环境变量：

```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/honor_power?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false"
$env:DB_USERNAME="honor"
$env:DB_PASSWORD="honor123"
$env:LIVE_PROVIDER_ENABLED="true"
$env:LIVE_PROVIDER_ENDPOINT="https://api.wzryqz.cn/gethero"
```

如需离线演示：

```powershell
$env:LIVE_PROVIDER_ENABLED="false"
$env:DEMO_DATA_ENABLED="true"
```

## 启动前端

```powershell
cd frontend
npm install
npm run dev
```

前端默认运行在 `http://localhost:5173`，开发服务器会将 `/api` 转发到后端。

## API

```text
GET /api/heroes?keyword=李白
GET /api/power/query?heroName=李白&platform=ANDROID&channel=WECHAT&provider=wzryqz
GET /api/options
```

## 数据来源边界

- 英雄列表来源：王者荣耀官网静态资源 `https://pvp.qq.com/web201605/js/herolist.json`。
- 推荐战力接口：`https://api.wzryqz.cn/gethero`，返回县/市/省前 10 低分位置，以及全国榜第 10 / 第 100 名战力。
- 备用战力接口：`https://api.xxoo.team/hero/getHeroInfo.php`，返回每档最低值，前 10 明细不足。
- 数据准确性和时效性以供应商返回的 `updatetime` 为准。
- 若你有正式授权的数据源，只需替换 `LiveHeroPowerProvider` 的适配逻辑。

## 微信小程序

`miniprogram` 目录是可直接导入微信开发者工具的原生小程序项目，支持：

- 全英雄搜索与选择
- Android / iOS、微信区 / QQ 区切换
- 推荐接口 / 备用接口切换
- 县标、市标、省标、小国标、大国标查询
- 点击榜单卡片查看前 10 明细

开发者工具本地联调：

1. 启动后端 `mvn spring-boot:run`。
2. 使用微信开发者工具导入 `miniprogram` 目录。
3. 在开发者工具中勾选“不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书”。
4. 默认 API 地址为 `http://localhost:8080`，配置位在 `miniprogram/app.js`。

真机调试和发布：

1. 将后端部署到 HTTPS 域名。
2. 在微信公众平台将该域名加入小程序 `request` 合法域名。
3. 将 `https://game.gtimg.cn` 加入小程序 `downloadFile` 合法域名，用于加载英雄头像。
4. 修改 `miniprogram/app.js` 中的 `apiBaseUrl`。
5. 将 `miniprogram/project.config.json` 中的 `appid` 替换为你的小程序 AppID。
