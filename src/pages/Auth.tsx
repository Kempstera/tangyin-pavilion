import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TEXT, useI18n } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { Seal } from '../components/Seal'
import { hasSupabase } from '../lib/supabase'

export function Auth({ mode }: { mode: 'login' | 'register' }) {
  const { t, lang } = useI18n()
  const { signIn, signUp } = useAuth()
  const nav = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const isLogin = mode === 'login'

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    setOk('')
    if (!hasSupabase) {
      setErr(
        lang === 'hant'
          ? '本站尚未接上資料庫，暫不能註冊或登入。'
          : '本站尚未接上数据库，暂不能注册或登录。'
      )
      return
    }
    if (password.length < 6) {
      setErr(lang === 'hant' ? '密碼至少 6 位。' : '密码至少 6 位。')
      return
    }
    setBusy(true)
    try {
      if (isLogin) {
        const r = await signIn(email.trim(), password)
        if (r.error) {
          setErr(translateErr(r.error, lang))
        } else {
          nav('/guestbook')
        }
      } else {
        const r = await signUp(email.trim(), password, nickname.trim() || email.split('@')[0])
        if (r.error) {
          setErr(translateErr(r.error, lang))
        } else if (r.needConfirm) {
          setOk(
            lang === 'hant'
              ? '已送出。請至信箱點擊確認鏈接，再行登入。'
              : '已送出。请至信箱点击确认链接，再行登录。'
          )
        } else {
          nav('/guestbook')
        }
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="page">
      <div className="wrap">
        <div className="form-card">
          <div className="form-head">
            <div style={{ marginBottom: 18 }}>
              <Seal text="唐音" size="md" />
            </div>
            <h1 className="form-title">{isLogin ? t(TEXT.loginTitle) : t(TEXT.registerTitle)}</h1>
            <div className="form-sub">{isLogin ? t(TEXT.loginSub) : t(TEXT.registerSub)}</div>
          </div>

          {err && <div className="alert alert-error">{err}</div>}
          {ok && <div className="alert alert-ok">{ok}</div>}

          <form onSubmit={submit}>
            {!isLogin && (
              <div className="field">
                <label htmlFor="nick">{t(TEXT.nickname)}</label>
                <input
                  id="nick"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={40}
                  autoComplete="nickname"
                  placeholder={lang === 'hant' ? '如：長安客' : '如：长安客'}
                />
              </div>
            )}

            <div className="field">
              <label htmlFor="email">{t(TEXT.email)}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>

            <div className="field">
              <label htmlFor="pwd">{t(TEXT.password)}</label>
              <input
                id="pwd"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                placeholder="······"
              />
              {!isLogin && <div className="form-tip" style={{ marginTop: 6 }}>{t(TEXT.passwordHint)}</div>}
            </div>

            <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%', marginTop: 6 }}>
              {busy ? t(TEXT.loading) : isLogin ? t(TEXT.login) : t(TEXT.register)}
            </button>
          </form>

          <div className="form-alt">
            {isLogin ? t(TEXT.noAccount) : t(TEXT.hasAccount)}{' '}
            <Link to={isLogin ? '/register' : '/login'}>
              {isLogin ? t(TEXT.goRegister) : t(TEXT.goLogin)}
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

function translateErr(msg: string, lang: 'hans' | 'hant') {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials'))
    return lang === 'hant' ? '電郵或密碼有誤。' : '电邮或密码有误。'
  if (m.includes('already registered') || m.includes('already been registered'))
    return lang === 'hant' ? '此電郵已註冊，請直接登入。' : '此电邮已注册，请直接登录。'
  if (m.includes('email not confirmed'))
    return lang === 'hant' ? '電郵尚未確認，請先至信箱點擊確認鏈接。' : '电邮尚未确认，请先至信箱点击确认链接。'
  if (m.includes('rate limit') || m.includes('too many'))
    return lang === 'hant' ? '嘗試過頻，請稍後再試。' : '尝试过频，请稍后再试。'
  return msg
}
