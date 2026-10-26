import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Lang } from './types'

const S = (hans: string, hant: string) => ({ hans, hant })
export type Pair = { hans: string; hant: string }

export const TEXT = {
  brand: S('唐音阁', '唐音閣'),
  brandSub: S('全唐诗', '全唐詩'),

  navHome: S('卷首', '卷首'),
  navSearch: S('检索', '檢索'),
  navAuthors: S('诗人', '詩人'),
  navFeatured: S('名篇', '名篇'),
  navGuestbook: S('题壁', '題壁'),
  navAbout: S('凡例', '凡例'),

  login: S('登录', '登入'),
  register: S('注册', '註冊'),
  logout: S('退出', '登出'),

  heroSub: S('一阁收尽盛唐音', '一閣收盡盛唐音'),
  heroLine: S('自贞观至天祐，二百八十九年间，诗家辈出，篇什如林。', '自貞觀至天祐，二百八十九年間，詩家輩出，篇什如林。'),

  searchPlaceholder: S('输入诗名、诗人，或一句诗……', '輸入詩名、詩人，或一句詩……'),
  searchBtn: S('检索', '檢索'),
  tryLabel: S('试', '試'),

  portalAuthor: S('按诗人', '按詩人'),
  portalAuthorDesc: S('三千六百余家，各附小传', '三千六百餘家，各附小傳'),
  portalGenre: S('按体裁', '按體裁'),
  portalGenreDesc: S('五律七绝，各归其类', '五律七絕，各歸其類'),
  portal300: S('唐诗三百首', '唐詩三百首'),
  portal300Desc: S('蘅塘退士选本', '蘅塘退士選本'),
  portalRandom: S('随手一卷', '隨手一卷'),
  portalRandomDesc: S('随机遇见一首唐诗', '隨機遇見一首唐詩'),

  featured: S('名篇荐读', '名篇薦讀'),
  featuredSub: S('千古传诵，家喻户晓', '千古傳誦，家喻戶曉'),
  poetsSection: S('诗人小传', '詩人小傳'),
  poetsSectionSub: S('存诗最多者', '存詩最多者'),
  more: S('查看更多', '查看更多'),

  statPoems: S('唐诗', '唐詩'),
  statPoets: S('诗人', '詩人'),
  statChars: S('总字数', '總字數'),
  statYears: S('唐祚', '唐祚'),

  original: S('原文', '原文'),
  notes: S('注释', '註釋'),
  translation: S('白话译文', '白話譯文'),
  source: S('出处', '出處'),
  collation: S('校勘', '校勘'),
  related: S('相关诗作', '相關詩作'),
  sameAuthor: S('同作者作品', '同作者作品'),

  vertical: S('竖排', '豎排'),
  horizontal: S('横排', '橫排'),
  copy: S('复制', '複製'),
  copied: S('已复制', '已複製'),

  notesPending: S('此篇注释尚在整理中。', '此篇註釋尚在整理中。'),
  transPending: S('此篇白话译文尚在整理中。', '此篇白話譯文尚在整理中。'),
  pendingTip: S('全唐诗五万七千余首，注释与译文的整理非旦夕之功。可先至下列权威检索系统对校原文、参看旧注：', '全唐詩五萬七千餘首，註釋與譯文的整理非旦夕之功。可先至下列權威檢索系統對校原文、參看舊註：'),

  sourceSite: S('本站编撰', '本站編撰'),
  sourceNote: S(
    '唐音阁编撰，参校《全唐诗》底本、中国哲学书电子化计划（ctext.org）及通行选本',
    '唐音閣編撰，參校《全唐詩》底本、中國哲學書電子化計劃（ctext.org）及通行選本'
  ),
  sourceRef: S('参校', '參校'),

  searchTitle: S('检索', '檢索'),
  tabAll: S('全部', '全部'),
  tabTitle: S('诗题', '詩題'),
  tabAuthor: S('诗人', '詩人'),
  tabContent: S('诗句', '詩句'),
  found: S('共得', '共得'),
  items: S('首', '首'),
  noResult: S('未检得相应诗作', '未檢得相應詩作'),
  noResultTip: S('试试更换关键字，或改用诗人姓名检索', '試試更換關鍵字，或改用詩人姓名檢索'),

  prev: S('上一页', '上一頁'),
  next: S('下一页', '下一頁'),

  authorsTitle: S('诗人', '詩人'),
  authorsSub: S('按存诗数量排序', '按存詩數量排序'),
  authorPoems: S('首', '首'),

  bioSource: S('小传出自《全唐诗》诗人小传', '小傳出自《全唐詩》詩人小傳'),

  loginTitle: S('登录', '登入'),
  loginSub: S('以电邮注册，即可题壁留言', '以電郵註冊，即可題壁留言'),
  registerTitle: S('注册', '註冊'),
  registerSub: S('留一名字，与唐人同席', '留一名字，與唐人同席'),
  email: S('电邮', '電郵'),
  password: S('密码', '密碼'),
  nickname: S('署名', '署名'),
  passwordHint: S('至少 6 位字符', '至少 6 位字符'),
  noAccount: S('尚无账号？', '尚無帳號？'),
  hasAccount: S('已有账号？', '已有帳號？'),
  goRegister: S('前往注册', '前往註冊'),
  goLogin: S('前往登录', '前往登入'),
  authRequired: S('请先登录，再行题壁。', '請先登入，再行題壁。'),

  guestbookTitle: S('题壁', '題壁'),
  guestbookSub: S('古人题诗于壁，今人留言于此', '古人題詩於壁，今人留言於此'),
  msgPlaceholder: S('留下你的话……', '留下你的話……'),
  msgSubmit: S('题上', '題上'),
  msgEmpty: S('壁上尚空，君可为第一人。', '壁上尚空，君可為第一人。'),
  msgLoginTip: S('登录后即可题壁', '登入後即可題壁'),
  loading: S('载入中……', '載入中……'),
  submit: S('提交', '提交'),

  viewsTotal: S('累计访问', '累計訪問'),
  viewsToday: S('今日', '今日'),
  visitors: S('独立访客', '獨立訪客'),
  messages: S('题壁', '題壁'),

  aboutTitle: S('凡例', '凡例'),
  notFound: S('此页不存', '此頁不存'),
  notFoundTip: S('所寻之页已佚，请自卷首重来。', '所尋之頁已佚，請自卷首重來。'),
  backHome: S('返回卷首', '返回卷首'),

  footerDesc: S(
    '唐音阁为一座开放的唐诗阅读馆。全部诗作原文取自开源项目 chinese-poetry，依《全唐诗》编次。注释与译文逐步整理中，均标注出处。',
    '唐音閣為一座開放的唐詩閱讀館。全部詩作原文取自開源項目 chinese-poetry，依《全唐詩》編次。註釋與譯文逐步整理中，均標註出處。'
  ),
  footerData: S('数据来源', '資料來源'),
  footerNav: S('馆内', '館內'),
  footerRef: S('参校系统', '參校系統'),
  rights: S('本站为公益阅读项目，诗作原文属公有领域。', '本站為公益閱讀項目，詩作原文屬公有領域。'),
} as const

export const LANG_KEY = 'tang-lang'

interface I18nCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (p: Pair) => string
  /** 取繁/简字段 */
  pick: (hant: string | undefined | null, hans: string | undefined | null) => string
}

const Ctx = createContext<I18nCtx>({
  lang: 'hans',
  setLang: () => {},
  t: (p) => p.hans,
  pick: (hant, hans) => hans ?? hant ?? '',
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'hans'
    const saved = localStorage.getItem(LANG_KEY)
    return saved === 'hant' ? 'hant' : 'hans'
  })

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem(LANG_KEY, l) } catch { /* ignore */ }
    document.documentElement.lang = l === 'hant' ? 'zh-Hant' : 'zh-Hans'
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang === 'hant' ? 'zh-Hant' : 'zh-Hans'
  }, [lang])

  const t = useCallback((p: Pair) => p[lang], [lang])
  const pick = useCallback(
    (hant: string | undefined | null, hans: string | undefined | null) =>
      lang === 'hant' ? (hant ?? hans ?? '') : (hans ?? hant ?? ''),
    [lang]
  )

  return <Ctx.Provider value={{ lang, setLang, t, pick }}>{children}</Ctx.Provider>
}

export function useI18n() {
  return useContext(Ctx)
}
