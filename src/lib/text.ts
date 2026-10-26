import type { Lang, Poem, Author, NoteEntry } from './types'

export const poemTitle = (p: Poem, lang: Lang) => (lang === 'hant' ? p.title : p.title_s || p.title)
export const poemShortTitle = (p: Poem, lang: Lang) =>
  lang === 'hant' ? p.short_title || p.title : p.short_title_s || p.short_title || p.title_s || p.title
export const poemAuthor = (p: Poem, lang: Lang) => (lang === 'hant' ? p.author : p.author_s || p.author)
export const poemLines = (p: Poem, lang: Lang) => (lang === 'hant' ? p.paragraphs : p.paragraphs_s || p.paragraphs)
export const poemContent = (p: Poem, lang: Lang) => (lang === 'hant' ? p.content : p.content_s || p.content)
export const poemTranslation = (p: Poem, lang: Lang) =>
  lang === 'hant' ? p.translation || '' : p.translation_s || p.translation || ''
export const authorName = (a: Author, lang: Lang) => (lang === 'hant' ? a.name : a.name_s || a.name)
export const authorBio = (a: Author, lang: Lang) => (lang === 'hant' ? a.description : a.description_s || a.description)
export const noteText = (n: NoteEntry, lang: Lang) => (lang === 'hant' ? n.text : n.text_s || n.text)
export const noteTerm = (n: NoteEntry, lang: Lang) => (lang === 'hant' ? n.term : n.term_s || n.term)

export function formatDate(iso: string, lang: Lang) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  if (lang === 'hant') return `${d.getFullYear()} 年 ${pad(d.getMonth() + 1)} 月 ${pad(d.getDate())} 日`
  return `${d.getFullYear()} 年 ${pad(d.getMonth() + 1)} 月 ${pad(d.getDate())} 日`
}

export function relTime(iso: string, lang: Lang) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return lang === 'hant' ? '方才' : '刚刚'
  if (m < 60) return lang === 'hant' ? `${m} 分鐘前` : `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return lang === 'hant' ? `${h} 小時前` : `${h} 小时前`
  const d = Math.floor(h / 24)
  if (d < 30) return lang === 'hant' ? `${d} 日前` : `${d} 天前`
  return formatDate(iso, lang)
}

/** 体裁名：数据层为简体，繁体界面需转换 */
const GENRE_HANT: Record<string, string> = {
  五言绝句: '五言絕句',
  七言绝句: '七言絕句',
  五言律诗: '五言律詩',
  七言律诗: '七言律詩',
  五言排律: '五言排律',
  七言排律: '七言排律',
  五言古体: '五言古體',
  七言古体: '七言古體',
  四言古体: '四言古體',
  乐府: '樂府',
  杂言: '雜言',
}
export const genreText = (g: string, lang: Lang) => (lang === 'hant' ? GENRE_HANT[g] || g : g)


/** 简体数字转中文大写数字（用于「五万七千四百一十八首」这类表述） */
const DIG = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
const UNIT = ['', '十', '百', '千']
export function cnNum(n: number): string {
  if (n === 0) return '零'
  if (n < 10) return DIG[n]
  if (n < 20) return '十' + (n % 10 ? DIG[n % 10] : '')
  const s = String(n)
  let out = ''
  let zero = false
  for (let i = 0; i < s.length; i++) {
    const d = Number(s[i])
    const u = s.length - 1 - i
    if (d === 0) {
      zero = true
      if (u === 4) out += '万'
      continue
    }
    if (zero && out && !out.endsWith('万')) out += '零'
    zero = false
    if (u > 4) {
      out += DIG[d] + UNIT[u - 4] + '万'
    } else if (u === 4) {
      out += DIG[d] + '万'
    } else {
      out += DIG[d] + UNIT[u]
    }
  }
  return out.replace(/零+$/, '')
}

/** 繁体版本的中文数字（零→零，二→二，与简体一致，仅「万」→「萬」） */
export function cnNumHant(n: number): string {
  return cnNum(n).replace(/万/g, '萬')
}

export function numText(n: number, lang: Lang) {
  return (lang === 'hant' ? cnNumHant(n) : cnNum(n)) + (lang === 'hant' ? '首' : '首')
}
