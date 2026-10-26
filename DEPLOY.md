# 部署指南

目标：把唐音閣部署到 `poem.signupeverywhere.cc`，后端用 Supabase，前端用 Cloudflare Pages。

需要两样东西：

1. **Supabase 项目**（数据库 + 认证）
2. **Cloudflare Pages 项目**（托管 + 域名）

---

## 一、Supabase

### 1. 建项目

打开 <https://supabase.com/dashboard>，**New project**：

| 项 | 建议值 |
|---|---|
| Name | `tangyin-pavilion` |
| Database Password | 自行生成强密码，记下来 |
| Region | `Southeast Asia (Singapore)` 或 `Northeast Asia (Tokyo)`（离中国近） |
| Plan | Free |

创建后等待约 2 分钟初始化。

### 2. 建表

左侧 **SQL Editor** → New query，把 `supabase/schema.sql` 全文粘进去 → **Run**。

成功后 Tables 里应出现 `authors`、`poems`、`guestbook`、`page_visits` 四张表。

### 3. 灌数据

在 **Project Settings → API** 里复制两个值：

- `Project URL`（形如 `https://xxxx.supabase.co`）
- `service_role` secret（**不要泄露**，只在本机命令行用）

然后在本机执行：

```bash
cd poem-garden

# 先作家（poems 有外键指向 authors）
SUPABASE_URL=https://xxxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... \
node scripts/seed-supabase.mjs authors

# 再作诗，约 57,000 条，需数分钟
SUPABASE_URL=https://xxxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... \
node scripts/seed-supabase.mjs poems
```

若中途中断，直接重跑即可（按主键 upsert，幂等）。

### 4. 关闭邮箱确认（可选）

**Authentication → Providers → Email**：
关闭 `Confirm email`，注册后即可直接登录，无需收信。
若要保留确认，则需在 **Authentication → URL Configuration** 里把 Site URL 设为正式域名，
否则确认链接会跳回 localhost。

### 5. 取出前端要用的 key

**Project Settings → API** → 复制：

- `Project URL`
- `anon` `public` key（可公开，受 RLS 保护）

---

## 二、Cloudflare Pages

### 方式 A：连 GitHub 自动部署（推荐）

1. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**
2. 选择仓库 `Kempstera/tangyin-pavilion`
3. 构建配置：

| 项 | 值 |
|---|---|
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | `22`（环境变量加 `NODE_VERSION=22`） |

4. **Environment variables** 加两条：

```
VITE_SUPABASE_URL = https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGci...（anon public）
```

5. Save and Deploy。

### 方式 B：命令行直推

```bash
npm run build

CLOUDFLARE_API_TOKEN=xxx \
npx wrangler pages deploy dist --project-name tangyin-pavilion
```

首次会创建项目，之后同一命令即可更新。

---

## 三、绑定域名

前提：`signupeverywhere.cc` 的 DNS 已托管在 Cloudflare。

1. Pages 项目 → **Custom domains → Set up a custom domain**
2. 输入 `poem.signupeverywhere.cc`
3. Cloudflare 会自动在 DNS 里加一条 CNAME 指向 `<project>.pages.dev`
4. 等待证书签发（通常 1–3 分钟）

打开 <https://poem.signupeverywhere.cc> 验证。

> 若 `signupeverywhere.cc` 不在 Cloudflare 托管，则需在域名注册商处
> 手动添加 CNAME：`poem` → `tangyin-pavilion.pages.dev`。

---

## 四、验证清单

- [ ] 首页显示 56,999 首、3,663 家
- [ ] 搜索「春江花月夜」有结果，且无重复
- [ ] 搜索「李白」显示其作品
- [ ] 打开《将进酒》，有原文、注译、出处
- [ ] 打开《静夜思》，篇下有「异文」提示
- [ ] 右上角切「繁」，全站变繁体
- [ ] 注册账号 → 题壁留言 → 列表出现
- [ ] 题壁页顶显示累计访问数

---

## 五、常见问题

**搜索报错 500 / 无结果**
→ 检查 `VITE_SUPABASE_*` 环境变量是否填对，改完需重新部署。

**诗句检索很慢**
→ 确认 `supabase/schema.sql` 里的 `pg_trgm` 索引已建：
`select indexname from pg_indexes where tablename = 'poems';`

**注册后收不到确认邮件**
→ Free 计划有发信频率限制，建议关闭 `Confirm email`（见 1.4）。

**访问统计一直是 0**
→ `record_visit` 是 security definer 函数，确认已 `grant execute`（schema.sql 末尾有）。
也可在 SQL Editor 执行 `select count(*) from page_visits;` 看是否有写入。
