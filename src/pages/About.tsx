import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TEXT, useI18n } from '../lib/i18n'
import { getMeta } from '../lib/api'
import type { MetaInfo } from '../lib/types'
import { SITE_REFS } from '../lib/refs'
import { Seal } from '../components/Seal'

export function About() {
  const { t, lang } = useI18n()
  const [meta, setMeta] = useState<MetaInfo | null>(null)

  useEffect(() => {
    getMeta().then(setMeta).catch(() => {})
  }, [])

  const H = lang === 'hant'
  const h2Style: React.CSSProperties = { fontSize: '1.12rem', letterSpacing: '0.2em', marginBottom: 16 }
  const pStyle: React.CSSProperties = {
    fontSize: '0.96rem',
    lineHeight: 2.15,
    color: 'var(--ink-2)',
    letterSpacing: '0.02em',
    textAlign: 'justify',
    marginBottom: 14,
  }

  return (
    <main className="page">
      <div className="wrap wrap-narrow">
        <div style={{ textAlign: 'center', marginBottom: 46 }}>
          <Seal text="凡例" size="md" />
          <h1
            style={{
              fontSize: '1.72rem',
              letterSpacing: '0.3em',
              paddingLeft: '0.3em',
              marginTop: 20,
            }}
          >
            {t(TEXT.aboutTitle)}
          </h1>
          <p style={{ fontSize: '0.78rem', letterSpacing: '0.16em', color: 'var(--ink-4)', marginTop: 8 }}>
            {H ? '編纂說明與資料來源' : '编纂说明与数据来源'}
          </p>
        </div>

        {meta && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))',
              gap: 1,
              background: 'var(--line-soft)',
              border: '1px solid var(--line-soft)',
              marginBottom: 52,
            }}
          >
            {[
              { n: meta.total_poems.toLocaleString('en-US'), l: H ? '詩' : '诗' },
              { n: meta.total_authors.toLocaleString('en-US'), l: H ? '詩人' : '诗人' },
              { n: `${(meta.total_chars / 10000).toFixed(1)} 萬`, l: H ? '字' : '字' },
              { n: meta.total_tang300.toLocaleString('en-US'), l: H ? '三百首' : '三百首' },
              { n: (meta.total_annotated || meta.total_featured || 59).toLocaleString('en-US'), l: H ? '已注譯' : '已注译' },
            ].map((it) => (
              <div key={it.l} style={{ background: 'var(--paper-raise)', padding: '18px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.16rem', color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{it.n}</div>
                <div style={{ fontSize: '0.7rem', letterSpacing: '0.16em', color: 'var(--ink-4)', marginTop: 2 }}>
                  {it.l}
                </div>
              </div>
            ))}
          </div>
        )}

        <section style={{ marginBottom: 44 }}>
          <h2 className="section-title" style={h2Style}>
            {H ? '一 · 緣起' : '一 · 缘起'}
          </h2>
          <p style={pStyle}>
            {H
              ? '唐詩是中國詩歌的頂點。三百餘年間，留下五萬七千餘首作品、三千六百餘位作者。歷來選本眾多，然《唐詩三百首》之外，絕大多數詩篇沉於卷帙，常人難以得見。'
              : '唐诗是中国诗歌的顶点。三百余年间，留下五万七千余首作品、三千六百余位作者。历来选本众多，然《唐诗三百首》之外，绝大多数诗篇沉于卷帙，常人难以得见。'}
          </p>
          <p style={pStyle}>
            {H
              ? '唐音閣的用意很簡單：把《全唐詩》整座庫房打開，讓人可以按詩人、按詩題、按詩句、按體裁自由走動，隨手抽出一卷來讀。'
              : '唐音阁的用意很简单：把《全唐诗》整座库房打开，让人可以按诗人、按诗题、按诗句、按体裁自由走动，随手抽出一卷来读。'}
          </p>
        </section>

        <section style={{ marginBottom: 44 }}>
          <h2 className="section-title" style={h2Style}>
            {H ? '二 · 底本與編次' : '二 · 底本与编次'}
          </h2>
          <p style={pStyle}>
            {H
              ? '全部詩作原文取自開源項目 '
              : '全部诗作原文取自开源项目 '}
            <a href="https://github.com/chinese-poetry/chinese-poetry" target="_blank" rel="noreferrer" style={{ color: 'var(--ochre)', borderBottom: '1px solid rgba(161,101,60,.35)' }}>
              chinese-poetry
            </a>
            {H
              ? '，該項目以《全唐詩》為底本數字化，並附詩人小傳。本站承其成果，依原書編次排列，未作重排。'
              : '，该项目以《全唐诗》为底本数字化，并附诗人小传。本站承其成果，依原书编次排列，未作重排。'}
          </p>
          <p style={pStyle}>
            {H
              ? '詩人小傳徑錄《全唐詩》所附小傳原文，不作改寫，來源已在各詩人頁標明。'
              : '诗人小传径录《全唐诗》所附小传原文，不作改写，来源已在各诗人页标明。'}
          </p>
        </section>

        <section style={{ marginBottom: 44 }}>
          <h2 className="section-title" style={h2Style}>
            {H ? '三 · 註釋與譯文' : '三 · 注释与译文'}
          </h2>
          <p style={pStyle}>
            {H
              ? '本站的註釋與白話譯文，除另行標註者外，均由本站編撰，參校《全唐詩》底本、中國哲學書電子化計劃（ctext.org）所收文本及通行選本。凡引用舊註，必標出處，不假託他人之名。'
              : '本站的注释与白话译文，除另行标注者外，均由本站编撰，参校《全唐诗》底本、中国哲学书电子化计划（ctext.org）所收文本及通行选本。凡引用旧注，必标出处，不假托他人之名。'}
          </p>
          <div
            style={{
              background: 'var(--celadon-wash)',
              border: '1px solid #c6d9d2',
              borderLeft: '3px solid var(--celadon)',
              padding: '18px 22px',
              fontSize: '0.92rem',
              lineHeight: 2,
              color: '#39564e',
              marginBottom: 16,
            }}
          >
            {H
              ? '關於進度，我們選擇說實話：五萬七千餘首詩的註譯，是數代學人尚未做完的工作。本站目前完成名篇註譯 59 篇，其餘篇目暫付闕如，並在篇末附上權威檢索系統，供讀者自行對校。與其用機器批量生成似是而非的註譯充數，不如把已有的數十篇做到可讀、可信。此後將逐批增補。'
              : '关于进度，我们选择说实话：五万七千余首诗的注译，是数代学人尚未做完的工作。本站目前完成名篇注译 59 篇，其余篇目暂付阙如，并在篇末附上权威检索系统，供读者自行对校。与其用机器批量生成似是而非的注译充数，不如把已有的数十篇做到可读、可信。此后将逐批增补。'}
          </div>
          <p style={pStyle}>
            {H
              ? '已注譯篇目，其註釋逐條列出難詞、典故、地名、官職；譯文則以現代漢語逐聯轉寫，力求不失原意，不添枝葉。'
              : '已注译篇目，其注释逐条列出难词、典故、地名、官职；译文则以现代汉语逐联转写，力求不失原意，不添枝叶。'}
          </p>
        </section>

        <section style={{ marginBottom: 44 }}>
          <h2 className="section-title" style={h2Style}>
            {H ? '四 · 異文' : '四 · 异文'}
          </h2>
          <p style={pStyle}>
            {H
              ? '《全唐詩》所據底本，與今日通行選本常有出入。如李白《靜夜思》底本作「牀前看月光……舉頭望山月」，崔顥《黃鶴樓》底本作「昔人已乘白雲去」，杜牧《江南春》底本作「綠映江」。'
              : '《全唐诗》所据底本，与今日通行选本常有出入。如李白《静夜思》底本作「床前看月光……举头望山月」，崔颢《黄鹤楼》底本作「昔人已乘白云去」，杜牧《江南春》底本作「绿映江」。'}
          </p>
          <p style={pStyle}>
            {H
              ? '本站不改原文以就通行本，而是在篇下另設「異文」一欄，兩存其說。讀書者若覺與記憶不合，多數情況並非本站錄錯，而是底本不同。'
              : '本站不改原文以就通行本，而是在篇下另设「异文」一栏，两存其说。读书者若觉与记忆不合，多数情况并非本站录错，而是底本不同。'}
          </p>
        </section>

        <section style={{ marginBottom: 44 }}>
          <h2 className="section-title" style={h2Style}>
            {H ? '五 · 參校系統' : '五 · 参校系统'}
          </h2>
          <p style={pStyle}>
            {H
              ? '下列系統為唐詩研究之重鎮，本站編纂時多所參校，讀者亦可徑往檢索：'
              : '下列系统为唐诗研究之重镇，本站编纂时多所参校，读者亦可径往检索：'}
          </p>
          <div className="external-links">
            {SITE_REFS.map((r) => (
              <a key={r.url} className="ext-link" href={r.url} target="_blank" rel="noreferrer noopener">
                {H ? r.name.hant : r.name.hans}
                <span className="arw">↗</span>
              </a>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 className="section-title" style={h2Style}>
            {H ? '六 · 技術' : '六 · 技术'}
          </h2>
          <p style={pStyle}>
            {H
              ? '前端以 React 與 Vite 構建，部署於 Cloudflare；帳號、留言與訪問統計由 Supabase 提供。全站支援簡繁兩種界面，可隨時於右上角切換。'
              : '前端以 React 与 Vite 构建，部署于 Cloudflare；账号、留言与访问统计由 Supabase 提供。全站支持简繁两种界面，可随时于右上角切换。'}
          </p>
          <p style={pStyle}>
            {H
              ? '本站為公益閱讀項目，詩作原文屬公有領域。若發現錄文或註譯有誤，歡迎至 '
              : '本站为公益阅读项目，诗作原文属公有领域。若发现录文或注译有误，欢迎至 '}
            <Link to="/guestbook" style={{ color: 'var(--ochre)', borderBottom: '1px solid rgba(161,101,60,.35)' }}>
              {H ? '題壁' : '题壁'}
            </Link>
            {H ? ' 指出。' : ' 指出。'}
          </p>
        </section>
      </div>
    </main>
  )
}
