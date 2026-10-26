/** 外部权威检索与参校入口 */

const enc = (s: string) => encodeURIComponent(s)

export interface ExtRef {
  name: { hans: string; hant: string }
  url: string
  desc?: { hans: string; hant: string }
}

/** 按诗句/诗题检索原文 */
export function poemRefs(query: string, title: string): ExtRef[] {
  const q = query.slice(0, 30)
  return [
    {
      name: { hans: '中国哲学书电子化计划', hant: '中國哲學書電子化計劃' },
      url: `https://ctext.org/searchbooks.pl?if=gb&searchu=${enc(q)}`,
      desc: { hans: '全文检索', hant: '全文檢索' },
    },
    {
      name: { hans: '搜韵 · 诗词检索', hant: '搜韻 · 詩詞檢索' },
      url: `https://sou-yun.cn/QueryPoem.aspx?key=${enc(title)}&lang=t`,
      desc: { hans: '原文与笺注', hant: '原文與箋註' },
    },
    {
      name: { hans: '寒泉古典文献全文检索', hant: '寒泉古典文獻全文檢索' },
      url: 'http://skqs.lib.ntnu.edu.tw/dragon/',
      desc: { hans: '台湾师大', hant: '臺灣師大' },
    },
    {
      name: { hans: '全唐诗检索系统', hant: '全唐詩檢索系統' },
      url: 'http://tssc.ntu.edu.tw/',
      desc: { hans: '台湾大学', hant: '臺灣大學' },
    },
  ]
}

/** 站点通用参校源 */
export const SITE_REFS: ExtRef[] = [
  {
    name: { hans: 'chinese-poetry 开源项目', hant: 'chinese-poetry 開源項目' },
    url: 'https://github.com/chinese-poetry/chinese-poetry',
  },
  {
    name: { hans: '中国哲学书电子化计划', hant: '中國哲學書電子化計劃' },
    url: 'https://ctext.org/zhs',
  },
  {
    name: { hans: '寒泉古典文献全文检索数据库', hant: '寒泉古典文獻全文檢索資料庫' },
    url: 'http://skqs.lib.ntnu.edu.tw/dragon/',
  },
  {
    name: { hans: '全唐诗检索系统（台湾大学）', hant: '全唐詩檢索系統（臺灣大學）' },
    url: 'http://tssc.ntu.edu.tw/',
  },
  {
    name: { hans: '搜韵 · 诗词门户', hant: '搜韻 · 詩詞門戶' },
    url: 'https://sou-yun.cn/',
  },
]
