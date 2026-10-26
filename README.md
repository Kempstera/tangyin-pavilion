# 唐音閣 · 全唐詩

一座开放的全唐诗阅读馆。收诗 **56,999 首**、诗人 **3,663 家**，可依诗题、诗人、诗句、体裁多维检索；名篇附注释与白话译文，并标注出处。

线上地址：<https://poem.signupeverywhere.cc>

---

## 特性

| 能力 | 说明 |
|---|---|
| 全量诗库 | 56,999 首，依《全唐诗》编次；诗人小传全量收录 |
| 多维索引 | 诗题 / 诗人 / 诗句 / 体裁 / 唐诗三百首，繁简互通 |
| 诗作页 | 原文（可切换竖排）、异文对照、注释、白话译文、同作者作品 |
| 作者页 | 小传 + 全部作品分页 |
| 繁简双界面 | 全站文案与诗文双轨，右上角随时切换 |
| 账号 | Supabase Auth 邮箱注册登录 |
| 题壁 | 登录后留言，带昵称与时间 |
| 访问统计 | 累计访问 / 今日 / 独立访客 / 题壁数 |

## 技术栈

- **前端**：React 19 + TypeScript + Vite 8，纯手写 CSS（无 UI 框架）
- **数据**：Supabase (PostgreSQL 15 + pg_trgm 全文检索)
- **托管**：Cloudflare Pages
- **数据源**：[chinese-poetry](https://github.com/chinese-poetry/chinese-poetry)

## 本地开发

```bash
npm install
cp .env.example .env.local     # 填入 Supabase 地址与 anon key（可留空，走离线模式）
npm run dev
```

未配置 Supabase 时自动进入**离线模式**：全量浏览、诗题/诗人检索、作者页均可用；
诗句检索、注册、留言、统计需连接数据库。

## 数据管线

```bash
# 1. 下载原始数据到 /var/tmp/tang-data/raw（58 个 poet.tang.*.json + authors.tang.json + 唐诗三百首.json）
# 2. 构建站内静态包与 Supabase 种子
node scripts/build-data.cjs

# 3. 导入 Supabase（需 service_role key）
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJ... \
node scripts/seed-supabase.mjs authors
# 再导 poems
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-supabase.mjs poems
```

产出：

- `public/data/index.json` — 检索索引（繁简双列，3.8 MB，搜索页懒加载）
- `public/data/poems/{0..142}.json` — 正文分片，每片 400 首
- `public/data/authors.json` — 诗人与小传
- `supabase/seed/*.jsonl` — 数据库种子

## 部署

```bash
npm run build
npx wrangler pages deploy dist --project-name tangyin-pavilion
```

环境变量在 Cloudflare Pages 项目中配置：

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

绑定自定义域名 `poem.signupeverywhere.cc` 后即可访问。

数据库结构见 `supabase/schema.sql`，在 Supabase SQL Editor 中整段执行。

## 注译说明

注释与白话译文除另行标注外，均为本站编撰，参校《全唐诗》底本、
中国哲学书电子化计划（ctext.org）及通行选本。当前完成名篇 **59 篇**，
其余篇目在诗作页给出权威检索入口，供读者对校。

## 异文

《全唐诗》底本与今日通行选本常有出入，本站不改原文，
而在篇下设「异文」一栏两存其说。例如：

- 李白《静夜思》底本作「牀前看月光……舉頭望山月」
- 崔颢《黄鹤楼》底本作「昔人已乘白雲去」
- 杜牧《江南春》底本作「千里鶯啼綠映江」

## 授权

诗作原文属公有领域；站内注译文字与前端代码以 MIT 许可发布。
