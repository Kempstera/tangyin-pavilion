/**
 * 数据访问层
 * - 配置了 Supabase：走数据库（全功能：全文检索、注译、留言、统计）
 * - 未配置：走 /data 静态包（离线兜底，支持诗题/诗人检索与浏览）
 */
import { supabase, hasSupabase } from './supabase'
import type { Author, MetaInfo, Poem, SearchHit, GuestMessage, SiteStats } from './types'

type SearchField = 'all' | 'title' | 'author' | 'content'

const cache = new Map<string, unknown>()
async function jget<T>(path: string): Promise<T> {
  if (cache.has(path)) return cache.get(path) as T
  const p = fetch(path).then((r) => {
    if (!r.ok) throw new Error(`fetch ${path} ${r.status}`)
    return r.json() as Promise<T>
  })
  cache.set(path, p)
  return p
}

interface RawIndex {
  total: number
  /** [繁体名, 简体名] */
  authors: [string, string][]
  /** [id, 繁标题, 简标题, authorIdx, isTang300, isFeatured] */
  rows: [number, string, string, number, number, number][]
}

let idxPromise: Promise<RawIndex> | null = null
function loadIndex() {
  if (!idxPromise) idxPromise = jget<RawIndex>('/data/index.json')
  return idxPromise
}

let authorsPromise: Promise<Author[]> | null = null
function loadAuthors() {
  if (!authorsPromise) authorsPromise = jget<Author[]>('/data/authors.json')
  return authorsPromise
}

let metaPromise: Promise<MetaInfo> | null = null
export function getMeta() {
  if (!metaPromise) metaPromise = jget<MetaInfo>('/data/meta.json')
  return metaPromise
}

/** ---------- 检索 ---------- */
export interface SearchResult {
  hits: SearchHit[]
  total: number
  mode: 'db' | 'static'
}

const PAGE = 20

export async function searchPoems(opts: {
  q: string
  field?: SearchField
  page?: number
  genre?: string
  authorId?: number
  onlyTang300?: boolean
}): Promise<SearchResult> {
  const { q, field = 'all', page = 1, genre, authorId, onlyTang300 } = opts
  const from = (page - 1) * PAGE

  if (hasSupabase && supabase) {
    let query = supabase
      .from('poems')
      .select('id,title,title_s,short_title,short_title_s,author,author_s,author_id,genre,is_tang300,content,content_s', {
        count: 'exact',
      })

    if (q) {
      const kw = q.replace(/[%_]/g, '')
      if (field === 'title') query = query.or(`title.ilike.%${kw}%,title_s.ilike.%${kw}%`)
      else if (field === 'author') query = query.or(`author.ilike.%${kw}%,author_s.ilike.%${kw}%`)
      else if (field === 'content') query = query.or(`content.ilike.%${kw}%,content_s.ilike.%${kw}%`)
      else
        query = query.or(
          `title.ilike.%${kw}%,title_s.ilike.%${kw}%,author.ilike.%${kw}%,author_s.ilike.%${kw}%,content.ilike.%${kw}%,content_s.ilike.%${kw}%`
        )
    }
    if (genre) query = query.eq('genre', genre)
    if (authorId) query = query.eq('author_id', authorId)
    if (onlyTang300) query = query.eq('is_tang300', true)

    query = query.order('id', { ascending: true }).range(from, from + PAGE - 1)

    const { data, count, error } = await query
    if (error) throw error

    const hits = (data || []).map((r) => {
      const content: string = r.content || ''
      const snippet = makeSnippet(content, r.title, q)
      return {
        id: r.id,
        title: r.title,
        title_s: r.title_s,
        short_title: r.short_title || r.title,
        short_title_s: r.short_title_s || r.title_s,
        author: r.author,
        author_s: r.author_s,
        author_id: r.author_id,
        genre: r.genre,
        is_tang300: r.is_tang300,
        snippet: snippet.hant,
        snippet_s: snippet.hans,
      } as SearchHit
    })
    return { hits: dedupeHits(hits), total: count ?? hits.length, mode: 'db' }
  }

  // ---- 静态兜底：诗题 / 诗人（繁简互通），诗句检索需数据库 ----
  const idx = await loadIndex()
  const kw = q.trim()
  let rows = idx.rows
  if (genre || authorId || onlyTang300) {
    rows = await filterRowsByMeta(rows, { genre, authorId, onlyTang300 })
  }
  if (kw) {
    const aHit = (i: number) => {
      const a = idx.authors[i]
      return a ? a[0].includes(kw) || a[1].includes(kw) : false
    }
    if (field === 'title') rows = rows.filter((r) => r[1].includes(kw) || r[2].includes(kw))
    else if (field === 'author') rows = rows.filter((r) => aHit(r[3]))
    else if (field === 'content') rows = []
    else
      rows = rows.filter(
        (r) => r[1].includes(kw) || r[2].includes(kw) || aHit(r[3])
      )
  }
  const total = rows.length
  const slice = rows.slice(from, from + PAGE)
  // 补正文摘要
  const poemMap = new Map<number, Poem>()
  const byShard = new Map<number, number[]>()
  for (const r of slice) {
    const sd = Math.floor((r[0] - 1) / 400)
    if (!byShard.has(sd)) byShard.set(sd, [])
    byShard.get(sd)!.push(r[0])
  }
  for (const [sd, ids] of byShard) {
    try {
      const arr = await loadShard(sd)
      for (const id of ids) {
        const p = arr.find((x) => x.id === id)
        if (p) poemMap.set(id, p)
      }
    } catch { /* ignore */ }
  }
  const hits: SearchHit[] = slice.map((r) => ({
    id: r[0],
    title: r[1],
    title_s: r[2],
    short_title: r[1],
    short_title_s: r[2],
    author: idx.authors[r[3]]?.[0] || '',
    author_s: idx.authors[r[3]]?.[1] || idx.authors[r[3]]?.[0] || '',
    author_id: r[3] + 1,
    genre: poemMap.get(r[0])?.genre || '',
    is_tang300: r[4] === 1,
    snippet: poemMap.get(r[0])?.content.slice(0, 56) || '',
    snippet_s: (poemMap.get(r[0])?.content_s || poemMap.get(r[0])?.content || '').slice(0, 56),
  }))
  return { hits: dedupeHits(hits), total, mode: 'static' }
}

const shardCache = new Map<number, Poem[]>()
async function loadShard(s: number): Promise<Poem[]> {
  if (!shardCache.has(s)) shardCache.set(s, await jget<Poem[]>(`/data/poems/${s}.json`))
  return shardCache.get(s)!
}

async function filterRowsByMeta(
  rows: [number, string, string, number, number, number][],
  f: { genre?: string; authorId?: number; onlyTang300?: boolean }
) {
  if (f.onlyTang300) rows = rows.filter((r) => r[4] === 1)
  if (f.authorId) rows = rows.filter((r) => r[3] + 1 === f.authorId)
  if (f.genre) {
    const idx = await loadIndex()
    const pageIds = new Set<number>()
    const totalShards = Math.ceil(idx.total / 400)
    // 只扫描包含候选 id 的分片
    const candidateShards = new Set(rows.map((r) => Math.floor((r[0] - 1) / 400)))
    for (let s = 0; s < totalShards; s++) {
      if (!candidateShards.has(s)) continue
      try {
        const shard = await jget<Poem[]>(`/data/poems/${s}.json`)
        for (const p of shard) if (p.genre === f.genre) pageIds.add(p.id)
      } catch { /* ignore */ }
    }
    rows = rows.filter((r) => pageIds.has(r[0]))
  }
  return rows
}

/** 同一作者、同一短标题者（多为乐府分类重出或异体字差异），展示时只留一条 */
function dedupeHits(hits: SearchHit[]): SearchHit[] {
  const seen = new Set<string>()
  const out: SearchHit[] = []
  for (const h of hits) {
    const k1 = `${h.author}||${h.short_title || h.title}`
    const k2 = `${h.author}||${(h.snippet || '').slice(0, 30)}`
    if (seen.has(k1) || seen.has(k2)) continue
    seen.add(k1)
    seen.add(k2)
    out.push(h)
  }
  return out
}

function makeSnippet(content: string, title: string, q: string) {
  let s = content
  if (q) {
    const i = content.indexOf(q)
    if (i > 24) s = '…' + content.slice(i - 18, i + 42)
    else s = content.slice(0, 60)
  } else s = content.slice(0, 60)
  return { hant: s, hans: s }
}

/** ---------- 单首诗 ---------- */
export async function getPoem(id: number): Promise<Poem | null> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase.from('poems').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return (data as Poem) || null
  }
  const shard = Math.floor((id - 1) / 400)
  try {
    const arr = await jget<Poem[]>(`/data/poems/${shard}.json`)
    return arr.find((p) => p.id === id) || null
  } catch {
    return null
  }
}

/** 批量取（首页名篇） */
export async function getPoemsByIds(ids: number[]): Promise<Poem[]> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase.from('poems').select('*').in('id', ids)
    if (error) throw error
    const map = new Map((data as Poem[]).map((p) => [p.id, p]))
    return ids.map((i) => map.get(i)).filter(Boolean) as Poem[]
  }
  const res: Poem[] = []
  const byShard = new Map<number, number[]>()
  for (const id of ids) {
    const s = Math.floor((id - 1) / 400)
    if (!byShard.has(s)) byShard.set(s, [])
    byShard.get(s)!.push(id)
  }
  for (const [s, list] of byShard) {
    try {
      const arr = await jget<Poem[]>(`/data/poems/${s}.json`)
      for (const id of list) {
        const p = arr.find((x) => x.id === id)
        if (p) res.push(p)
      }
    } catch { /* ignore */ }
  }
  return ids.map((i) => res.find((p) => p.id === i)).filter(Boolean) as Poem[]
}

/** ---------- 名篇：唐诗三百首精选 ---------- */
export async function getTang300(page = 1, size = 8): Promise<{ poems: Poem[]; total: number }> {
  if (hasSupabase && supabase) {
    const from = (page - 1) * size
    const { data, count, error } = await supabase
      .from('poems')
      .select('*', { count: 'exact' })
      .eq('is_tang300', true)
      .order('id', { ascending: true })
      .range(from, from + size - 1)
    if (error) throw error
    return { poems: (data as Poem[]) || [], total: count ?? 0 }
  }
  const idx = await loadIndex()
  const rows = idx.rows.filter((r) => r[4] === 1)
  const slice = rows.slice((page - 1) * size, (page - 1) * size + size)
  const poems = await getPoemsByIds(slice.map((r) => r[0]))
  return { poems, total: rows.length }
}

/** ---------- 精选名篇 ---------- */
export async function getFeaturedPoems(size = 8): Promise<Poem[]> {
  const meta = await getMeta()
  const ids = (meta.featured_ids || []).slice(0, size)
  if (!ids.length) return []
  return getPoemsByIds(ids)
}

/** 每日一诗：以日期为种，从精选池中取 */
export async function getDailyPoem(): Promise<Poem | null> {
  const meta = await getMeta()
  const ids = meta.featured_ids || []
  if (!ids.length) return null
  const d = new Date()
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
  const id = ids[seed % ids.length]
  return getPoem(id)
}

/** ---------- 作者 ---------- */
export async function getAuthor(slug: string): Promise<Author | null> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase.from('authors').select('*').eq('slug', slug).maybeSingle()
    if (error) throw error
    return (data as Author) || null
  }
  const list = await loadAuthors()
  return list.find((a) => a.slug === slug) || null
}

export async function getAuthorById(id: number): Promise<Author | null> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase.from('authors').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return (data as Author) || null
  }
  const list = await loadAuthors()
  return list.find((a) => a.id === id) || null
}

export async function listAuthors(page = 1, size = 60): Promise<{ authors: Author[]; total: number }> {
  if (hasSupabase && supabase) {
    const from = (page - 1) * size
    const { data, count, error } = await supabase
      .from('authors')
      .select('*', { count: 'exact' })
      .order('poem_count', { ascending: false })
      .range(from, from + size - 1)
    if (error) throw error
    return { authors: (data as Author[]) || [], total: count ?? 0 }
  }
  const list = await loadAuthors()
  return { authors: list.slice((page - 1) * size, page * size), total: list.length }
}

/** ---------- 相关诗作 ---------- */
export async function getRelatedPoems(poem: Poem, size = 4): Promise<Poem[]> {
  if (hasSupabase && supabase) {
    const { data } = await supabase
      .from('poems')
      .select('*')
      .eq('author', poem.author)
      .neq('id', poem.id)
      .order('is_tang300', { ascending: false })
      .order('id', { ascending: true })
      .limit(size)
    return (data as Poem[]) || []
  }
  const { hits } = await searchPoems({ q: poem.author, field: 'author', page: 1, authorId: poem.author_id })
  const ids = hits.filter((h) => h.id !== poem.id).slice(0, size).map((h) => h.id)
  return getPoemsByIds(ids)
}

/** ---------- 随机一首 ---------- */
export async function randomPoemId(): Promise<number> {
  const meta = await getMeta()
  return 1 + Math.floor(Math.random() * meta.total_poems)
}

/** ---------- 访问统计 ---------- */
function visitorKey(): string {
  let v = localStorage.getItem('tang-visitor')
  if (!v) {
    v = Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('tang-visitor', v)
  }
  return v
}

export async function recordVisit(path: string) {
  if (!hasSupabase || !supabase) return
  try {
    await supabase.rpc('record_visit', {
      p_path: path.slice(0, 200),
      p_visitor: visitorKey(),
      p_ref: (document.referrer || '').slice(0, 200),
    })
  } catch { /* 静默失败，不影响阅读 */ }
}

export async function getSiteStats(): Promise<SiteStats | null> {
  if (!hasSupabase || !supabase) return null
  try {
    const { data, error } = await supabase.rpc('get_site_stats')
    if (error) return null
    return data as SiteStats
  } catch {
    return null
  }
}

/** ---------- 留言 ---------- */
export async function listMessages(page = 1, size = 20): Promise<{ messages: GuestMessage[]; total: number }> {
  if (!hasSupabase || !supabase) return { messages: [], total: 0 }
  const from = (page - 1) * size
  const { data, count, error } = await supabase
    .from('guestbook')
    .select('id,nickname,content,created_at,user_id', { count: 'exact' })
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .range(from, from + size - 1)
  if (error) throw error
  return { messages: (data as GuestMessage[]) || [], total: count ?? 0 }
}

export async function addMessage(content: string, nickname: string): Promise<{ ok: boolean; error?: string }> {
  if (!hasSupabase || !supabase) return { ok: false, error: 'offline' }
  const { data: userData } = await supabase.auth.getUser()
  const uid = userData.user?.id
  if (!uid) return { ok: false, error: 'auth' }
  const { error } = await supabase.from('guestbook').insert({
    user_id: uid,
    nickname: nickname.slice(0, 40),
    content: content.slice(0, 2000),
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export { hasSupabase }
