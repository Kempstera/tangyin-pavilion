#!/usr/bin/env node
/**
 * 把 supabase/seed/*.jsonl 导入 Supabase
 *
 * 用法：
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   node scripts/seed-supabase.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SEED = path.join(__dirname, '..', 'supabase', 'seed')

const URL_BASE = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!URL_BASE || !KEY) {
  console.error('缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const BATCH = Number(process.env.BATCH_SIZE || 400)
const CONCURRENCY = Number(process.env.CONCURRENCY || 3)
const TABLE = process.argv[2] || 'poems'

function readJsonl(file) {
  const txt = fs.readFileSync(file, 'utf8')
  return txt.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l))
}

async function upsert(batch) {
  const res = await fetch(`${URL_BASE}/rest/v1/${TABLE}`, {
    method: 'POST',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(batch),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status} ${text.slice(0, 400)}`)
  }
}

async function main() {
  const file = path.join(SEED, `${TABLE}.jsonl`)
  if (!fs.existsSync(file)) {
    console.error('找不到种子文件', file)
    process.exit(1)
  }
  const rows = readJsonl(file)
  console.log(`${TABLE}: ${rows.length} 行，批大小 ${BATCH}，并发 ${CONCURRENCY}`)

  const batches = []
  for (let i = 0; i < rows.length; i += BATCH) batches.push(rows.slice(i, i + BATCH))

  let done = 0
  let failed = 0

  async function worker() {
    while (batches.length) {
      const b = batches.shift()
      if (!b) break
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await upsert(b)
          done += b.length
          break
        } catch (e) {
          if (attempt === 3) {
            failed += b.length
            console.error('批次失败：', e.message)
          } else {
            await new Promise((r) => setTimeout(r, 800 * attempt))
          }
        }
      }
      const pct = ((done + failed) / rows.length * 100).toFixed(1)
      process.stdout.write(`\r  进度 ${done}/${rows.length} (${pct}%) 失败 ${failed}   `)
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  console.log(`\n完成：成功 ${done}，失败 ${failed}`)
  if (failed) process.exit(2)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
