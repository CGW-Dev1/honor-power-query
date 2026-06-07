import fs from 'node:fs'
import path from 'node:path'

const OUT = path.resolve('design-previews')
fs.mkdirSync(OUT, { recursive: true })

const W = 430
const H = 920

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function text(x, y, value, options = {}) {
  const {
    size = 24,
    weight = 500,
    fill = '#222',
    anchor = 'start',
    opacity = 1,
    letter = 0,
    family = '"PingFang SC", "Microsoft YaHei", Arial, sans-serif'
  } = options
  return `<text x="${x}" y="${y}" font-family=${family} font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" opacity="${opacity}" letter-spacing="${letter}">${esc(value)}</text>`
}

function rect(x, y, w, h, options = {}) {
  const {
    fill = '#fff',
    stroke = 'none',
    sw = 1,
    rx = 0,
    opacity = 1,
    filter = ''
  } = options
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}" ${filter ? `filter="${filter}"` : ''}/>`
}

function circle(cx, cy, r, options = {}) {
  const { fill = '#fff', opacity = 1, stroke = 'none', sw = 1 } = options
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${opacity}" stroke="${stroke}" stroke-width="${sw}"/>`
}

function line(x1, y1, x2, y2, options = {}) {
  const { stroke = '#ddd', sw = 1, opacity = 1, cap = 'round' } = options
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}" stroke-linecap="${cap}"/>`
}

function phoneFrame(title, subtitle, bg, content, defs = '') {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="22" flood-color="#2b1724" flood-opacity="0.18"/>
    </filter>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#b14d78" flood-opacity="0.12"/>
    </filter>
    ${defs}
  </defs>
  ${rect(0, 0, W, H, { fill: '#f2f2f4' })}
  ${rect(18, 18, W - 36, H - 36, { fill: bg, rx: 42, filter: 'url(#shadow)' })}
  ${rect(163, 30, 104, 24, { fill: 'rgba(0,0,0,0.82)', rx: 12 })}
  ${text(38, 54, '15:48', { size: 18, weight: 800, fill: bg === '#111318' ? '#f4f4f5' : '#28232b' })}
  ${text(392, 54, '4G  26%', { size: 13, weight: 800, fill: bg === '#111318' ? '#f4f4f5' : '#28232b', anchor: 'end' })}
  ${text(38, 102, title, { size: 14, weight: 900, fill: bg === '#111318' ? '#a7f3d0' : '#e75d91', letter: 2 })}
  ${text(38, 132, subtitle, { size: 28, weight: 900, fill: bg === '#111318' ? '#f8fafc' : '#2f2731' })}
  ${content}
  ${rect(145, 888, 140, 5, { fill: bg === '#111318' ? '#4b5563' : '#c9c4c7', rx: 3 })}
</svg>`
}

function statCard(x, y, w, h, label, value, region, theme) {
  return [
    rect(x, y, w, h, { fill: theme.card, rx: 20, stroke: theme.stroke, filter: 'url(#soft)' }),
    text(x + 16, y + 30, label, { size: 15, weight: 900, fill: theme.muted }),
    text(x + 16, y + 72, value, { size: 34, weight: 900, fill: theme.accent }),
    text(x + 16, y + 102, region, { size: 13, weight: 700, fill: theme.text })
  ].join('')
}

function optionA() {
  const theme = { card: '#1c2330', stroke: '#2b3548', accent: '#f6c66f', muted: '#8ea2c6', text: '#e5e7eb' }
  const content = `
    ${circle(335, 110, 118, { fill: '#243144', opacity: 0.85 })}
    ${rect(38, 156, 354, 86, { fill: '#1a202c', rx: 24, stroke: '#303b52' })}
    ${text(60, 188, '李白 · 青莲剑仙', { size: 22, weight: 900, fill: '#f8fafc' })}
    ${text(60, 216, 'Android / 微信区 · 渠道一', { size: 13, weight: 700, fill: '#93a4bd' })}
    ${rect(300, 174, 68, 44, { fill: '#f6c66f', rx: 16 })}
    ${text(334, 202, '查询', { size: 17, weight: 900, fill: '#1a202c', anchor: 'middle' })}
    ${statCard(38, 266, 166, 126, '县标', '1,050', '井陉矿区', theme)}
    ${statCard(226, 266, 166, 126, '市标', '4,537', '双鸭山市', theme)}
    ${statCard(38, 412, 166, 126, '省标', '8,595', '宁夏', theme)}
    ${statCard(226, 412, 166, 126, '小国标', '13,377', '全国第100', theme)}
    ${statCard(38, 558, 354, 126, '大国标', '15,409', '全国第10名', theme)}
    ${text(38, 730, 'LOWEST TOP 10', { size: 13, weight: 900, fill: '#f6c66f', letter: 2 })}
    ${[0, 1, 2].map((i) => `${rect(38, 750 + i * 46, 354, 34, { fill: '#151b25', rx: 12 })}${text(54, 773 + i * 46, `#${i + 1}`, { size: 14, weight: 900, fill: '#f6c66f' })}${text(98, 773 + i * 46, ['安徽省池州市', '云南省迪庆藏族自治州', '辽宁省辽阳市'][i], { size: 14, weight: 700, fill: '#e5e7eb' })}${text(370, 773 + i * 46, ['6,027', '6,033', '6,074'][i], { size: 15, weight: 900, fill: '#f6c66f', anchor: 'end' })}`).join('')}
  `
  return phoneFrame('OPTION A', '赛事数据面板风', '#111318', content)
}

function optionB() {
  const theme = { card: '#fff7ef', stroke: '#f4d4aa', accent: '#b7791f', muted: '#7c4a1f', text: '#3f2b1c' }
  const content = `
    ${rect(38, 156, 354, 192, { fill: 'url(#goldHero)', rx: 30, filter: 'url(#soft)' })}
    ${circle(110, 230, 54, { fill: '#fff5dc', stroke: '#f6c66f', sw: 5 })}
    ${text(110, 240, '李', { size: 42, weight: 900, fill: '#8a4b12', anchor: 'middle' })}
    ${text(178, 210, '当前英雄', { size: 13, weight: 900, fill: '#7c4a1f' })}
    ${text(178, 246, '李白', { size: 38, weight: 900, fill: '#3f2b1c' })}
    ${text(178, 276, '青莲剑仙', { size: 17, weight: 800, fill: '#7c4a1f' })}
    ${rect(38, 370, 354, 54, { fill: '#ffffff', rx: 20, stroke: '#f2dfc6' })}
    ${text(58, 404, '搜索英雄，如 孙悟空', { size: 15, fill: '#a06b3b' })}
    ${rect(38, 446, 166, 88, { fill: '#fff7ef', rx: 22, stroke: '#f4d4aa' })}
    ${rect(226, 446, 166, 88, { fill: '#2c1c14', rx: 22 })}
    ${text(121, 499, 'Android', { size: 18, weight: 900, fill: '#8a4b12', anchor: 'middle' })}
    ${text(309, 499, '微信区', { size: 18, weight: 900, fill: '#f6c66f', anchor: 'middle' })}
    ${statCard(38, 564, 166, 128, '县标', '1,050', '井陉矿区', theme)}
    ${statCard(226, 564, 166, 128, '市标', '4,537', '双鸭山市', theme)}
    ${statCard(38, 712, 166, 128, '省标', '8,595', '宁夏', theme)}
    ${statCard(226, 712, 166, 128, '国标', '13,377', '小国标', theme)}
  `
  const defs = `<linearGradient id="goldHero" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#fff4d7"/><stop offset="0.48" stop-color="#f8c66d"/><stop offset="1" stop-color="#8a4b12"/></linearGradient>`
  return phoneFrame('OPTION B', '王者卡牌风', '#fff9f1', content, defs)
}

function optionC() {
  const theme = { card: '#ffffff', stroke: '#e9e9ee', accent: '#2563eb', muted: '#64748b', text: '#0f172a' }
  const content = `
    ${rect(38, 156, 354, 56, { fill: '#ffffff', rx: 18, stroke: '#e5e7eb' })}
    ${text(58, 191, '搜索英雄 / 地区', { size: 15, fill: '#94a3b8' })}
    ${rect(38, 232, 354, 76, { fill: '#f8fafc', rx: 22, stroke: '#e5e7eb' })}
    ${text(58, 266, '李白', { size: 24, weight: 900, fill: '#0f172a' })}
    ${text(58, 290, 'Android · 微信区 · 渠道一', { size: 13, fill: '#64748b' })}
    ${rect(300, 248, 72, 42, { fill: '#2563eb', rx: 16 })}
    ${text(336, 275, '查询', { size: 16, weight: 900, fill: '#fff', anchor: 'middle' })}
    ${['县标', '市标', '省标', '小国标', '大国标'].map((label, i) => {
      const y = 334 + i * 92
      const values = ['1,050', '4,537', '8,595', '13,377', '15,409']
      const regions = ['河北省石家庄市井陉矿区', '黑龙江省双鸭山市', '宁夏回族自治区', '全国榜第100名', '全国榜第10名']
      return `${rect(38, y, 354, 72, { fill: '#ffffff', rx: 18, stroke: '#e5e7eb' })}${text(58, y + 31, label, { size: 15, weight: 900, fill: '#0f172a' })}${text(58, y + 55, regions[i], { size: 12, fill: '#64748b' })}${text(370, y + 45, values[i], { size: 25, weight: 900, fill: '#2563eb', anchor: 'end' })}`
    }).join('')}
  `
  return phoneFrame('OPTION C', '极简工具风', '#f8fafc', content)
}

function optionD() {
  const theme = { card: '#fff6fa', stroke: '#ffd4e3', accent: '#e6538a', muted: '#8a5d73', text: '#342936' }
  const content = `
    ${circle(342, 154, 84, { fill: '#ffd4e3', opacity: 0.52 })}
    ${rect(38, 156, 354, 130, { fill: '#fff', rx: 28, stroke: '#ffd4e3', filter: 'url(#soft)' })}
    ${text(60, 198, '最低上榜战力', { size: 28, weight: 900, fill: '#342936' })}
    ${text(60, 226, '五档榜单，一屏看清', { size: 14, fill: '#8a5d73' })}
    ${rect(60, 244, 96, 28, { fill: '#fff0f6', rx: 14 })}
    ${text(108, 263, '实时查询', { size: 12, weight: 900, fill: '#e6538a', anchor: 'middle' })}
    ${rect(38, 310, 354, 54, { fill: '#fff', rx: 18, stroke: '#ffd4e3' })}
    ${text(58, 344, '李白 · 青莲剑仙', { size: 16, weight: 900, fill: '#342936' })}
    ${rect(38, 386, 166, 50, { fill: '#ff75a7', rx: 18 })}
    ${rect(226, 386, 166, 50, { fill: '#fff6fa', rx: 18, stroke: '#ffd4e3' })}
    ${text(121, 418, '微信区', { size: 16, weight: 900, fill: '#fff', anchor: 'middle' })}
    ${text(309, 418, 'QQ区', { size: 16, weight: 900, fill: '#63495a', anchor: 'middle' })}
    ${statCard(38, 468, 166, 128, '县标', '1,050', '井陉矿区', theme)}
    ${statCard(226, 468, 166, 128, '市标', '4,537', '双鸭山市', theme)}
    ${statCard(38, 616, 166, 128, '省标', '8,595', '宁夏', theme)}
    ${statCard(226, 616, 166, 128, '小国标', '13,377', '全国第100', theme)}
    ${rect(38, 772, 354, 54, { fill: '#ff75a7', rx: 18 })}
    ${text(215, 806, '查询最低战力', { size: 18, weight: 900, fill: '#fff', anchor: 'middle' })}
  `
  return phoneFrame('OPTION D', '轻甜樱花风', '#fff5f8', content)
}

function optionE() {
  const content = `
    ${rect(38, 156, 354, 174, { fill: '#ecfdf5', rx: 30, stroke: '#bbf7d0' })}
    ${circle(114, 238, 54, { fill: '#10b981', opacity: 0.18 })}
    ${circle(270, 212, 36, { fill: '#10b981', opacity: 0.12 })}
    ${line(114, 238, 270, 212, { stroke: '#10b981', sw: 4, opacity: 0.35 })}
    ${text(60, 190, '最低战力洼地', { size: 16, weight: 900, fill: '#047857' })}
    ${text(60, 292, '井陉矿区 · 1,050', { size: 28, weight: 900, fill: '#064e3b' })}
    ${rect(38, 354, 354, 56, { fill: '#ffffff', rx: 18, stroke: '#d1fae5' })}
    ${text(58, 389, '李白  Android / 微信区', { size: 16, weight: 900, fill: '#064e3b' })}
    ${text(38, 452, '推荐低分位置', { size: 18, weight: 900, fill: '#064e3b' })}
    ${['河北省石家庄市井陉矿区', '黑龙江省双鸭山市', '宁夏回族自治区', '全国榜第100名'].map((name, i) => {
      const y = 474 + i * 82
      const vals = ['1,050', '4,537', '8,595', '13,377']
      const levels = ['县标', '市标', '省标', '小国标']
      return `${rect(38, y, 354, 64, { fill: '#ffffff', rx: 20, stroke: '#d1fae5' })}${circle(68, y + 32, 16, { fill: '#10b981' })}${text(68, y + 38, String(i + 1), { size: 13, weight: 900, fill: '#fff', anchor: 'middle' })}${text(96, y + 26, levels[i], { size: 13, weight: 900, fill: '#047857' })}${text(96, y + 48, name, { size: 13, fill: '#334155' })}${text(370, y + 42, vals[i], { size: 22, weight: 900, fill: '#059669', anchor: 'end' })}`
    }).join('')}
    ${rect(38, 820, 354, 42, { fill: '#10b981', rx: 16 })}
    ${text(215, 847, '查看前 10 低分位置', { size: 16, weight: 900, fill: '#fff', anchor: 'middle' })}
  `
  return phoneFrame('OPTION E', '地图榜单风', '#f0fdf4', content)
}

const files = [
  ['option-a-esports-dashboard.svg', optionA()],
  ['option-b-hero-card.svg', optionB()],
  ['option-c-minimal-tool.svg', optionC()],
  ['option-d-sakura-soft.svg', optionD()],
  ['option-e-map-ranking.svg', optionE()]
]

for (const [name, svg] of files) {
  fs.writeFileSync(path.join(OUT, name), svg, 'utf8')
}

const thumbW = 230
const thumbH = 492
const gap = 22
const sheetW = 5 * thumbW + 6 * gap
const sheetH = thumbH + 96
const sheet = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW}" height="${sheetH}" viewBox="0 0 ${sheetW} ${sheetH}">
  ${rect(0, 0, sheetW, sheetH, { fill: '#f7f2f5' })}
  ${text(gap, 38, '王者战力查询系统 UI 方向预览', { size: 28, weight: 900, fill: '#2f2731' })}
  ${files.map(([name], index) => {
    const x = gap + index * (thumbW + gap)
    return `<image href="./${name}" x="${x}" y="70" width="${thumbW}" height="${thumbH}" preserveAspectRatio="xMidYMid meet"/>`
  }).join('')}
</svg>`

fs.writeFileSync(path.join(OUT, 'ui-options-contact-sheet.svg'), sheet, 'utf8')
console.log(`Generated ${files.length + 1} preview images in ${OUT}`)
