import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { I18nProvider, TEXT, useI18n } from './lib/i18n'
import { AuthProvider } from './lib/auth'
import { Header, MobileNav } from './components/Header'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import { Search } from './pages/Search'
import { PoemDetail } from './pages/PoemDetail'
import { Authors } from './pages/Authors'
import { AuthorDetail } from './pages/AuthorDetail'
import { Featured } from './pages/Featured'
import { Guestbook } from './pages/Guestbook'
import { Auth } from './pages/Auth'
import { About } from './pages/About'
import { recordVisit } from './lib/api'
import './styles/global.css'

/** 统一设置页面标题（详情页与作者页自行设置，此处跳过） */
function TitleSync() {
  const { pathname } = useLocation()
  const { t } = useI18n()
  useEffect(() => {
    if (pathname.startsWith('/poem/') || pathname.startsWith('/author/')) return
    const brand = t(TEXT.brand)
    const map: [string, { hans: string; hant: string }][] = [
      ['/search', TEXT.searchTitle],
      ['/authors', TEXT.authorsTitle],
      ['/featured', TEXT.featured],
      ['/guestbook', TEXT.guestbookTitle],
      ['/about', TEXT.aboutTitle],
      ['/login', TEXT.loginTitle],
      ['/register', TEXT.registerTitle],
    ]
    const hit = map.find(([p]) => pathname.startsWith(p))
    document.title = hit ? `${t(hit[1])} · ${brand}` : `${brand} · ${t(TEXT.brandSub)}`
  }, [pathname, t])
  return null
}

function ScrollToTop() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  useEffect(() => {
    // 每次站内跳转计一次访问
    if (pathname.startsWith('/poem') || pathname === '/' || pathname === '/search') {
      void recordVisit(pathname + (search ? search.slice(0, 80) : ''))
    }
  }, [pathname, search])
  return null
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <TitleSync />
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/poem/:id" element={<PoemDetail />} />
            <Route path="/authors" element={<Authors />} />
            <Route path="/author/:slug" element={<AuthorDetail />} />
            <Route path="/featured" element={<Featured />} />
            <Route path="/guestbook" element={<Guestbook />} />
            <Route path="/login" element={<Auth mode="login" />} />
            <Route path="/register" element={<Auth mode="register" />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
          <MobileNav />
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  )
}

function NotFound() {
  return (
    <main className="page">
      <div className="wrap">
        <div className="empty">
          <div className="empty-mark">佚</div>
          <p>此页不存</p>
          <p style={{ marginTop: 8, fontSize: '0.84rem' }}>所寻之页已佚，请自卷首重来。</p>
          <a href="/" className="btn" style={{ marginTop: 22 }}>
            返回卷首
          </a>
        </div>
      </div>
    </main>
  )
}
