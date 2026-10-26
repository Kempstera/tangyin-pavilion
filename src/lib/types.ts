export interface Author {
  id: number
  name: string
  name_s: string
  slug: string
  description: string
  description_s: string
  poem_count: number
}

export interface NoteEntry {
  term: string
  term_s?: string
  text: string
  text_s?: string
}

export interface Poem {
  id: number
  title: string
  title_s: string
  short_title?: string
  short_title_s?: string
  author_id: number
  author: string
  author_s: string
  dynasty: string
  genre: string
  tags: string[]
  paragraphs: string[]
  paragraphs_s: string[]
  content: string
  content_s: string
  is_tang300: boolean
  char_count: number
  /** 以下为注译层，可能为空 */
  notes?: NoteEntry[] | null
  translation?: string | null
  translation_s?: string | null
  notes_source?: string | null
  translation_source?: string | null
  annotation_status?: 'full' | 'partial' | 'none'
}

export interface SearchHit {
  id: number
  title: string
  title_s: string
  short_title?: string
  short_title_s?: string
  author: string
  author_s: string
  author_id: number
  genre: string
  is_tang300: boolean
  snippet: string
  snippet_s: string
}

export interface GuestMessage {
  id: number
  nickname: string
  content: string
  created_at: string
  user_id?: string | null
}

export interface SiteStats {
  total_views: number
  today_views: number
  total_visitors: number
  total_messages: number
  total_users: number
}

export type Lang = 'hans' | 'hant'

export interface MetaInfo {
  total_poems: number
  total_authors: number
  total_tang300: number
  total_featured?: number
  total_annotated?: number
  featured_ids?: number[]
  total_chars: number
  shard_size: number
  shards: number
  genres: [string, number][]
}
