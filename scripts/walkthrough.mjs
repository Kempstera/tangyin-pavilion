import { chromium } from 'playwright'
import fs from 'node:fs'

const BASE = 'http://127.0.0.1:4173'
const OUT = '/var/tmp/shots'
fs.mkdirSync(OUT, { recursive: true })

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await chromium.launch({ executablePath: CHROME })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()

const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`[console] ${m.text()}`)
})
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))
page.on('requestfailed', (r) => {
  const u = r.url()
  if (u.startsWith('http://127.0.0.1')) errors.push(`[reqfail] ${u} ${r.failure()?.errorText}`)
})

async function shot(name, url, opts = {}) {
  await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(opts.wait || 900)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: opts.full !== false })
  console.log(`✓ ${name}  ${url}  「${await page.title()}」`)
}

// 先定位《将进酒》
await page.goto(BASE + '/search?q=' + encodeURIComponent('将进酒'), { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
const POEM = (await page.getAttribute('.result-item', 'href')) || '/poem/1'
console.log('测试诗页:', POEM)

await shot('v-home', '/')
await shot('v-search', '/search?q=' + encodeURIComponent('春江花月夜'))
await shot('v-search-author', '/search?q=' + encodeURIComponent('李白') + '&field=author')
await shot('v-poem', POEM)
await shot('v-poem-variant', '/poem/1')
await shot('v-authors', '/authors')
await shot('v-guestbook', '/guestbook')
await shot('v-about', '/about')

await page.goto(BASE + '/', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.setItem('tang-lang', 'hant'))
await shot('v-home-hant', '/')
await shot('v-poem-hant', POEM)
await page.evaluate(() => localStorage.setItem('tang-lang', 'hans'))

// 作者页
await page.goto(BASE + '/authors', { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
const authorHref = await page.getAttribute('.author-card', 'href')
if (authorHref) {
  await page.goto(BASE + authorHref, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}/v-author-detail.png`, fullPage: true })
  console.log('✓ v-author-detail', authorHref, '「' + (await page.title()) + '」')
}

// 移动端（非 isMobile，避免视口偏移）
const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const mp = await mob.newPage()
await mp.goto(BASE + '/', { waitUntil: 'networkidle' })
await mp.waitForTimeout(900)
await mp.screenshot({ path: `${OUT}/m-home.png`, fullPage: false })
await mp.goto(BASE + POEM, { waitUntil: 'networkidle' })
await mp.waitForTimeout(900)
await mp.screenshot({ path: `${OUT}/m-poem.png`, fullPage: false })
console.log('✓ 移动端')

// 竖排
await page.goto(BASE + POEM, { waitUntil: 'networkidle' })
await page.evaluate(() => {
  localStorage.setItem('tang-vertical', '0')
  localStorage.setItem('tang-lang', 'hans')
})
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: '竖排' }).click()
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/v-vertical.png`, fullPage: false })
console.log('✓ 竖排')

console.log('\n=== 错误 ===')
if (errors.length === 0) console.log('无')
else [...new Set(errors)].forEach((e) => console.log(e))

await browser.close()
