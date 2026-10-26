#!/usr/bin/env node
/**
 * 全唐诗数据构建脚本
 * 输入: raw/ (chinese-poetry 原始 JSON)
 * 输出: public/data/* (站内静态检索包) + supabase/seed/*.jsonl (Supabase 导入)
 */
const fs = require('fs');
const path = require('path');
const OpenCC = require('opencc-js');

const ROOT = path.resolve(__dirname, '..');
const RAW = process.env.RAW_DIR || '/var/tmp/tang-data/raw';
const OUT = path.join(ROOT, 'public', 'data');
const SEED = path.join(ROOT, 'supabase', 'seed');

const t2s = OpenCC.Converter({ from: 't', to: 'cn' });
const s2t = OpenCC.Converter({ from: 'cn', to: 't' });

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(SEED, { recursive: true });
fs.mkdirSync(path.join(OUT, 'poems'), { recursive: true });

// ---------- 读取 ----------
const files = fs.readdirSync(RAW)
  .filter(f => /^poet\.tang\.\d+\.json$/.test(f))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

let poems = [];
for (const f of files) {
  const arr = JSON.parse(fs.readFileSync(path.join(RAW, f), 'utf8'));
  poems.push(...arr);
}
console.log('原始诗数:', poems.length);

const bios = JSON.parse(fs.readFileSync(path.join(RAW, 'authors.tang.json'), 'utf8'));
const tang300 = JSON.parse(fs.readFileSync(path.join(RAW, 'tang300.json'), 'utf8'));

// ---------- 去重（保留首次出现，维持《全唐诗》编次） ----------
const seen = new Set();
const unique = [];
for (const p of poems) {
  if (!p.title || !Array.isArray(p.paragraphs) || p.paragraphs.length === 0) continue;
  const k = `${p.author}||${p.title}||${p.paragraphs[0]}`;
  if (seen.has(k)) continue;
  seen.add(k);
  unique.push(p);
}
poems = unique;
console.log('去重后:', poems.length);

// 同一作者、正文全同者（乐府分类与正文重出），保留标题更简洁的一条
{
  const key = (x) => `${x.author}||${x.paragraphs.join('')}`;
  const score = (x) => (/\s/.test(x.title) ? 0 : 1);
  const best = new Map();
  for (const p of poems) {
    const k = key(p);
    const prev = best.get(k);
    if (!prev || score(p) > score(prev)) best.set(k, p);
  }
  const before = poems.length;
  poems = poems.filter((p) => best.get(key(p)) === p);
  console.log('跨标题重出去重:', before, '->', poems.length);
}

// ---------- 注译层（本站编撰） ----------
const ANN_DIR = path.join(__dirname, 'annotations');
let anns = [];
if (fs.existsSync(ANN_DIR)) {
  for (const f of fs.readdirSync(ANN_DIR).filter(f => f.endsWith('.json')).sort()) {
    anns.push(...JSON.parse(fs.readFileSync(path.join(ANN_DIR, f), 'utf8')));
  }
}
const SOURCE_HANT = '唐音閣編撰，參校《全唐詩》底本、中國哲學書電子化計劃（ctext.org）及通行選本';
const annMap = new Map();
const annMiss = [];
for (const a of anns) {
  const p = poems.find(x => x.author === a.author && x.paragraphs.join('').includes(a.from));
  if (p) annMap.set(`${p.author}||${p.title}||${p.paragraphs[0]}`, a);
  else annMiss.push(`${a.author} / ${a.from}`);
}
console.log('注译匹配:', annMap.size, '/', anns.length);
if (annMiss.length) console.log('注译未匹配:', annMiss);

// ---------- 标题简称（去乐府分类前缀与组诗序号） ----------
const YUEFU_PREFIX = /^(鼓吹曲辭|橫吹曲辭|相和歌辭|雜曲歌辭|清商曲辭|舞曲歌辭|琴曲歌辭|近代曲辭|郊廟歌辭|燕射歌辭|樂府雜曲|新樂府辭|雜歌謠辭)\s+/;
function shortTitle(t) {
  let s = t.replace(YUEFU_PREFIX, '');
  // 去掉末尾「 一」「 十二」等组诗序号（须有空格且为纯汉字数字）
  // 组诗序号转为「（其一）」形式，保留信息
  s = s.replace(/\s([一二三四五六七八九十]+)$/, '（其$1）');
  s = s.replace(/[”"』」]+$/, '');
  return s.trim() || t;
}

// ---------- 精选名篇（按作者 + 标志诗句定位，避开标题异文） ----------
const FEATURED = [
  ['李白', '牀前看月光'], ['李白', '君不見黃河之水天上來'], ['李白', '噫吁嚱'],
  ['李白', '日照香爐生紫煙'], ['李白', '朝辭白帝彩雲間'], ['李白', '故人西辭黃鶴樓'],
  ['李白', '李白乘舟將欲行'], ['李白', '花間一壺酒'],
  ['杜甫', '國破山河在'], ['杜甫', '風急天高猨嘯哀'], ['杜甫', '岱宗夫如何'],
  ['杜甫', '八月秋高風怒號'], ['杜甫', '好雨知時節'],
  ['王維', '空山新雨後'], ['王維', '紅豆生南國'], ['王維', '單車欲問邊'],
  ['王維', '空山不見人'], ['王維', '渭城朝雨浥輕塵'],
  ['白居易', '離離原上草'], ['白居易', '潯陽江頭夜送客'], ['白居易', '漢皇重色思傾國'],
  ['白居易', '江南好'], ['孟浩然', '春眠不覺曉'], ['孟浩然', '故人具雞黍'],
  ['王之渙', '白日依山盡'], ['王之渙', '黃河遠上白雲間'],
  ['王昌齡', '秦時明月漢時關'], ['王昌齡', '寒雨連天夜入湖'],
  ['李商隱', '錦瑟無端五十絃'], ['李商隱', '相見時難別亦難'], ['李商隱', '君問歸期未有期'],
  ['杜牧', '遠上寒山石徑斜'], ['杜牧', '煙籠寒水月籠沙'], ['杜牧', '千里鶯啼綠映江'],
  ['張繼', '月落烏啼霜滿天'], ['張若虛', '春江潮水連海平'], ['崔顥', '昔人已乘白雲去'],
  ['王勃', '城闕輔三秦'], ['陳子昂', '前不見古人'], ['柳宗元', '千山鳥飛絕'],
  ['李紳', '鋤禾日當午'], ['劉禹錫', '朱雀橋邊野草花'], ['賀知章', '少小離家老大回'],
  ['韋應物', '獨憐幽草澗邊生'], ['賈島', '松下問童子'], ['李賀', '黑雲壓城城欲摧'],
  ['常建', '清晨入古寺'], ['王翰', '葡萄美酒夜光杯'], ['孟郊', '慈母手中線'],
  ['元稹', '曾經滄海難爲水'], ['張九齡', '海上生明月'], ['王灣', '客路青山外'],
  ['駱賓王', '西陸蟬聲唱'], ['高適', '十里黃雲白日曛'], ['岑參', '北風捲地白草折'],
  ['祖詠', '終南陰嶺秀'], ['宋之問', '嶺外音書斷'], ['溫庭筠', '雞聲茅店月'],
  ['韓愈', '一封朝奏九重天'],
];

const featuredIds = new Set();
const missed = [];
for (const [au, frag] of FEATURED) {
  const hit = poems.find(p => p.author === au && p.paragraphs.join('').includes(frag));
  if (hit) featuredIds.add(`${hit.author}||${hit.title}||${hit.paragraphs[0]}`);
  else missed.push(`${au} / ${frag}`);
}
console.log('精选匹配:', featuredIds.size, '/', FEATURED.length);
if (missed.length) console.log('未匹配:', missed);

// ---------- 唐诗三百首标记 ----------
const t300keys = new Set(tang300.map(p => `${p.author}||${p.title}`));
const t300first = new Set(tang300.map(p => `${p.author}||${p.paragraphs[0]}`));

// ---------- 作者 ----------
const bioMap = new Map(bios.map(b => [b.name, b]));
const authorCount = new Map();
for (const p of poems) authorCount.set(p.author, (authorCount.get(p.author) || 0) + 1);

// 作者排序：存诗多者在前
const authorList = [...authorCount.entries()]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh'));
const authorIndex = new Map();
const authors = [];

authorList.forEach(([name, count], idx) => {
  const bio = bioMap.get(name);
  const id = idx + 1;
  authorIndex.set(name, id);
  authors.push({
    id,
    name,
    name_s: t2s(name),
    slug: name,
    desc: bio?.desc || '',
    desc_s: bio?.desc ? t2s(bio.desc) : '',
    poem_count: count,
    order: id,
  });
});
console.log('作者:', authors.length);

// ---------- 体裁推断 ----------
function charLen(s) { return [...s.replace(/[^\u4e00-\u9fa5]/g, '')].length; }
// 按标点把段落拆成「句」
function splitSentences(paragraphs) {
  const out = [];
  for (const line of paragraphs) {
    const parts = line.split(/[，。！？、；：,.!?;:]/).map(s => s.trim()).filter(Boolean);
    out.push(...parts);
  }
  return out;
}
function inferGenre(p) {
  const tags = p.tags || [];
  if (tags.includes('乐府')) return '乐府';
  const sents = splitSentences(p.paragraphs);
  const m = sents.length;
  if (m === 0) return '杂言';
  const lens = sents.map(charLen);
  const avg = lens.reduce((a, b) => a + b, 0) / m;
  const even = lens.every(l => Math.abs(l - lens[0]) <= 1);
  if (!even) {
    if (avg >= 4.5 && avg <= 5.5) return '五言古体';
    if (avg >= 6.5 && avg <= 7.5) return '七言古体';
    return '杂言';
  }
  const w = Math.round(avg);
  if (m === 4 && w === 5) return '五言绝句';
  if (m === 4 && w === 7) return '七言绝句';
  if (m === 8 && w === 5) return '五言律诗';
  if (m === 8 && w === 7) return '七言律诗';
  if (m > 8 && w === 5) return '五言排律';
  if (m > 8 && w === 7) return '七言排律';
  if (w === 5) return '五言古体';
  if (w === 7) return '七言古体';
  if (w === 4) return '四言古体';
  return '杂言';
}

// ---------- 组装诗记录 ----------
const out = poems.map((p, i) => {
  const id = i + 1;
  const paragraphs = p.paragraphs.map(s => s.trim()).filter(Boolean);
  const paragraphs_s = paragraphs.map(s => t2s(s));
  const title = p.title.trim();
  const ann = annMap.get(`${p.author}||${title}||${paragraphs[0]}`);
  const isT300 = t300keys.has(`${p.author}||${title}`) || t300first.has(`${p.author}||${paragraphs[0]}`);
  const isFeatured = featuredIds.has(`${p.author}||${title}||${paragraphs[0]}`);
  return {
    id,
    title,
    title_s: t2s(title),
    short_title: shortTitle(title),
    short_title_s: t2s(shortTitle(title)),
    author_id: authorIndex.get(p.author) || 0,
    author: p.author,
    author_s: t2s(p.author),
    dynasty: '唐',
    genre: inferGenre(p),
    tags: p.tags || [],
    paragraphs,
    paragraphs_s,
    content: paragraphs.join(''),
    content_s: paragraphs_s.join(''),
    is_tang300: isT300,
    is_featured: isFeatured,
    notes: ann ? ann.notes.map(n => ({
      term: n.term,
      term_s: n.term_s || t2s(n.term),
      text: n.text,
      text_s: n.text_s || t2s(n.text),
    })) : null,
    translation: ann ? ann.translation : null,
    translation_s: ann ? (ann.translation_s || t2s(ann.translation)) : null,
    notes_source: ann ? SOURCE_HANT : null,
    translation_source: ann ? SOURCE_HANT : null,
    char_count: paragraphs.reduce((a, s) => a + charLen(s), 0),
  };
});

// ---------- 静态检索索引（列式压缩） ----------
const index = {
  generated_at: new Date().toISOString(),
  total: out.length,
  // [繁体名, 简体名]
  authors: authors.map(a => [a.name, a.name_s]),
  // [id, short_title_繁, short_title_简, authorIdx, isTang300, isFeatured]
  rows: out.map(p => [
    p.id, p.short_title, p.short_title_s, p.author_id - 1,
    p.is_tang300 ? 1 : 0, p.is_featured ? 1 : 0,
  ]),
};
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index));

// ---------- 正文分片（每片 400 首） ----------
const SHARD = 400;
const shards = Math.ceil(out.length / SHARD);
for (let s = 0; s < shards; s++) {
  const slice = out.slice(s * SHARD, (s + 1) * SHARD);
  fs.writeFileSync(path.join(OUT, 'poems', `${s}.json`), JSON.stringify(slice));
}
console.log('分片:', shards);

// ---------- 作者包 ----------
fs.writeFileSync(path.join(OUT, 'authors.json'), JSON.stringify(authors));

// ---------- 元信息 ----------
const genreCount = {};
for (const p of out) genreCount[p.genre] = (genreCount[p.genre] || 0) + 1;
const meta = {
  generated_at: index.generated_at,
  total_poems: out.length,
  total_authors: authors.length,
  total_tang300: out.filter(p => p.is_tang300).length,
  total_featured: out.filter(p => p.is_featured).length,
  total_annotated: out.filter(p => p.notes && p.notes.length).length,
  featured_ids: out.filter(p => p.is_featured).map(p => p.id),
  total_chars: out.reduce((a, p) => a + p.char_count, 0),
  shard_size: SHARD,
  shards,
  genres: Object.entries(genreCount).sort((a, b) => b[1] - a[1]),
  sources: [
    { name: 'chinese-poetry', url: 'https://github.com/chinese-poetry/chinese-poetry', note: '全唐诗原文与诗人小传' },
    { name: '中国哲学书电子化计划', url: 'https://ctext.org', note: '校勘参考' },
    { name: '全唐诗分析系统', url: 'https://github.com/chinese-poetry', note: '检索参考' },
    { name: '寒泉古典文献全文检索资料库', url: 'http://skqs.lib.ntnu.edu.tw/dragon/', note: '校勘参考' },
    { name: '台湾大学全唐诗检索系统', url: 'http://tssc.ntu.edu.tw/', note: '校勘参考' },
  ],
};
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 2));

// ---------- Supabase 种子 ----------
const w = (name, rows) => {
  fs.writeFileSync(path.join(SEED, name), rows.map(r => JSON.stringify(r)).join('\n'));
};
w('authors.jsonl', authors.map(a => ({
  id: a.id, name: a.name, name_s: a.name_s, slug: a.slug,
  description: a.desc, description_s: a.desc_s, poem_count: a.poem_count,
})));
w('poems.jsonl', out.map(p => ({
  id: p.id, title: p.title, title_s: p.title_s,
  short_title: p.short_title, short_title_s: p.short_title_s,
  author_id: p.author_id, author: p.author, author_s: p.author_s,
  dynasty: p.dynasty, genre: p.genre, tags: p.tags,
  paragraphs: p.paragraphs, paragraphs_s: p.paragraphs_s,
  content: p.content, content_s: p.content_s,
  is_tang300: p.is_tang300, is_featured: p.is_featured,
  notes: p.notes, translation: p.translation, translation_s: p.translation_s,
  notes_source: p.notes_source, translation_source: p.translation_source,
  char_count: p.char_count,
})));

console.log('\n=== 统计 ===');
console.log('诗:', meta.total_poems, '| 作者:', meta.total_authors, '| 唐诗三百首:', meta.total_tang300);
console.log('总字数:', meta.total_chars);
console.log('体裁:', meta.genres.slice(0, 8));
const sz = (f) => (fs.statSync(f).size / 1048576).toFixed(2) + 'MB';
console.log('index.json:', sz(path.join(OUT, 'index.json')));
console.log('authors.json:', sz(path.join(OUT, 'authors.json')));
console.log('seed poems.jsonl:', sz(path.join(SEED, 'poems.jsonl')));
