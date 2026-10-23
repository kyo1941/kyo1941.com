# AGENTS.md

このファイルは、このリポジトリで作業する AI コーディングエージェント向けの実務ガイドです。
このファイルと実コード・設定ファイルが食い違う場合は、実コードを優先してください。

## リポジトリ概要

個人ポートフォリオサイトです。公開ページ、ブログ、ポートフォリオ、問い合わせフォーム、管理画面、ブログ管理用 MCP サーバーを含みます。

```
/
├── frontend/   Next.js 16 + React 19 + TypeScript + Tailwind CSS
├── backend/    Ktor + Kotlin + Koin + Exposed + Flyway + MySQL
├── mcp/        ブログ操作用 MCP stdio サーバー
├── docker-compose.yml
└── README.md
```

開発時の基本構成:

```
Next.js frontend :3000
  ├─ public API fetch -> NEXT_PUBLIC_API_BASE_URL (通常 http://localhost:8080)
  ├─ /api/auth/login -> backend /api/auth/login のプロキシ
  └─ /api/admin/*   -> backend /api/admin/* のプロキシ + revalidatePath()

Ktor backend :8080
  └─ MySQL :3306
```

本番バックエンドは Railway で、ビルド・デプロイ設定は Railway のダッシュボード側にあります（リポジトリには置いていません）。
以下は控えで、ずれている場合はダッシュボードが正です。

- Builder: Dockerfile（`backend/Dockerfile`）
- Root Directory: 空のまま（Dockerfile がリポジトリ直下をビルドコンテキストとして `backend/...` を COPY するため）
- Restart Policy: On Failure（最大 10 回）

Railway の Config as Code（`railway.json` / `railway.toml`）は 2026-12-01 以降読まれなくなるため使っていません。
本番 URL やホスティング先を変更・追記するときは Vercel/Railway 側の実設定を確認してから更新してください。

## 重要な作業ルール

- 既存の未コミット変更を勝手に戻さないでください。
- `.env`, `.env.local`, `application.yaml` などの秘密情報を含むファイルをコミット対象にしないでください。テンプレートは `.env.example`, `frontend/.env.local.example`, `backend/app/src/main/resources/application.yaml.template` を使います。
- 生成物や依存物を編集対象にしないでください: `node_modules/`, `.next/`, `dist/`, `build/`, `.gradle/`。
- API 仕様やルーティングを変更したら、frontend repository/network 層、backend routes/service/repository 層、MCP の呼び出し先をまとめて確認してください。
- 管理系の変更 API は CSRF 保護と JWT cookie 認証に依存します。`Origin` と `auth_token` cookie の扱いを崩さないでください。
- フロントエンドでは App Router 配下の既存構成に合わせ、ページから直接 fetch を増やすより、既存の repository/hook/component の分離に寄せてください。
- バックエンドでは routes にビジネスロジックを置かず、service と repository に分けてください。

## 開発コマンド

ルート:

```bash
docker-compose up
```

`docker-compose up` は backend と MySQL を起動します。frontend は別途起動します。

frontend:

```bash
cd frontend
pnpm dev
pnpm build
pnpm lint
pnpm format
pnpm fix
pnpm check
```

backend:

```bash
cd backend
./gradlew :app:run
./gradlew :app:test
./gradlew :app:test --tests "my.backend.routes.BlogRoutesTest"
./gradlew :app:ktlintCheck
./gradlew :app:ktlintFormat
./gradlew :app:buildFatJar
```

mcp:

```bash
cd mcp
npm run build
npm run dev
npm start
```

## 環境変数と設定

ルートの `.env.example` は Docker Compose/backend 用、`frontend/.env.local.example` は frontend 用です。

主要な変数:

- `NEXT_PUBLIC_API_BASE_URL`: frontend から見た backend URL。開発時は `http://localhost:8080`。
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: Cloudflare Turnstile の公開サイトキー。
- `TURNSTILE_SECRET_KEY`: backend で Turnstile 検証に使う秘密キー。
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RECIPIENT_EMAIL`: 問い合わせメール送信用。
- `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`: backend の JWT 発行/検証と frontend proxy の検証で同じ値にします。
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`: backend の管理ユーザー。ログインは DB の `users` のハッシュと照合します。
  - DB の初回作成時は Flyway の `V2__InsertAdminUser` が環境変数から管理ユーザーを挿入します。
  - 以降は起動のたびに `AdminAccountService` が `application.yaml` の `app.admin.*` を読み、`ADMIN_PASSWORD` と DB のハッシュが一致しなければ上書きします。パスワードを変えるときは変数を変えて backend を再デプロイします。
  - `ADMIN_USERNAME` のユーザーが DB にいなければ、警告ログを出すだけで作成はしません。ユーザー名を変えても既存の管理ユーザーは改名されません。
  - MCP サーバーは同名の値をログインのたびに使うため、パスワードを変えたら MCP 側の値も合わせて更新します（「MCP サーバー」節を参照）。
- `CORS_ALLOWED_ORIGINS`: backend CORS と CSRF の許可 Origin。複数指定はカンマ区切り。
- `DB_DRIVER`, `DB_URL`, `DB_USER`, `DB_PASSWORD`, `DB_MAX_POOL_SIZE`: backend の HikariCP/Exposed/Flyway 用 DB 設定。

backend の `application.yaml` は gitignore 対象です。新しい設定キーを追加するときは `application.yaml.template` と `.env.example` も更新してください。

## Frontend 設計

技術:

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- `jose` による JWT 検証
- Cloudflare Turnstile
- Markdown 表示に `react-markdown`, `remark-gfm`, `rehype-highlight`, `rehype-raw`

主要ディレクトリ:

```
frontend/src/app/
├── page.tsx                  ルートページ。top UI に委譲
├── layout.tsx                ルートレイアウト
├── proxy.ts                  /admin 認証ガード
├── routes.ts                 サイト内/外部リンク定数
├── api/
│   ├── auth/login/route.ts   backend login のプロキシ。HttpOnly cookie を設定
│   └── admin/[...path]/      管理 API プロキシ。成功時に revalidatePath()
├── ui/                       公開ページ
├── admin/                    管理画面ページ
├── components/               汎用 UI
├── hooks/                    UI 状態・副作用
├── repository/               API 呼び出し境界
├── network/                  fetch 共通処理
├── types/                    共有型
├── lib/data/                 server-only データ取得
├── utils/                    表示・入力補助
└── data/                     静的プロフィール/スキル/経歴データ
```

既存の基本パターン:

```
page.tsx
  -> section component
    -> hook
      -> repository
        -> network helper
          -> backend API
```

公開 API は `frontend/src/app/network/publicApi.ts` の `API_BASE_URL` を使います。失敗時に null を返す取得系と、例外を投げる更新/詳細系が混在しているため、既存 repository の挙動に合わせてください。

管理画面:

- `/admin` と `/admin/*` は `frontend/src/proxy.ts` で保護されます。
- proxy は `auth_token` cookie を読み、`JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE` で検証します。
- ログインは `frontend/src/app/api/auth/login/route.ts` 経由で backend に委譲し、成功時に HttpOnly cookie を設定します。
- 管理 API の変更系は `frontend/src/app/api/admin/[...path]/route.ts` 経由で backend に転送され、成功時に該当ページを `revalidatePath()` します。
- ブログ・ポートフォリオ・タグの管理 UI は `frontend/src/app/admin/` にあります。

公開ページ:

- `/` は `frontend/src/app/ui/top/page.tsx` を表示します。
- `/ui/profile`, `/ui/blog`, `/ui/blog/[slug]`, `/ui/portfolio`, `/ui/portfolio/[slug]` が主要ページです。
- ルート定数は `frontend/src/app/routes.ts` にあります。

画像:

- `next.config.ts` は `NEXT_PUBLIC_API_BASE_URL/images/**` と `res.cloudinary.com` を許可しています。
- backend は `/images` を `static/images` リソースとして公開します。

## Backend 設計

技術:

- Kotlin/JVM 21
- Ktor 2.3
- Koin 3.5
- Exposed 0.50
- HikariCP
- Flyway
- MySQL 8
- kotlinx.serialization
- Resend
- Cloudflare Turnstile 検証用 Ktor Client
- flexmark + jsoup/commons-text による Markdown/HTML 処理

起動順序は `my.backend.Application.module()` を確認してください。

```
configureKoin()
DatabaseFactory.init()
configureSerialization()
configureHTTP()
configureSecurity()
configureCsrfProtection()
configureValidation()
configureStatusPages()
configureRouting()
```

主要ディレクトリ:

```
backend/app/src/main/kotlin/my/backend/
├── Application.kt
├── db/
│   ├── DatabaseFactory.kt
│   └── schema/
├── di/AppModule.kt
├── dto/
├── exception/
├── plugins/
├── repository/
├── routes/
├── service/
└── util/
```

レイヤー:

```
routes/<Feature>Routes.kt
  -> service/<Feature>Service.kt
    -> repository/<Feature>Repository.kt
      -> db/schema/*Table.kt
```

DI:

- `AppModule.kt` に HikariConfig/DataSource、DatabaseFactory、ApplicationConfig、HttpClient、Resend、repository、service を登録します。
- OGP 取得用 HttpClient は `named("ogp")` で JSON ContentNegotiation なしの別クライアントです。

DB:

- マイグレーションは `backend/app/src/main/resources/db/migration/`。
- 現在の主要テーブルは `users`, `blogs`, `tags`, `blog_tags`, `portfolios`。
- Flyway は `DatabaseFactory.init()` で起動時に実行されます。
- テーブル定義を変えたら、Exposed schema、DTO、repository、tests も確認してください。

認証・セキュリティ:

- JWT は `Security.kt` の `auth-jwt` で検証します。
- backend は Authorization header ではなく `auth_token` cookie から JWT を読みます。
- `CsrfProtection.kt` は POST/PUT/DELETE/PATCH に `Origin` を要求し、`CORS_ALLOWED_ORIGINS` と一致しない Origin を拒否します。
- `HTTP.kt` の CORS も `CORS_ALLOWED_ORIGINS` を URI として解釈して `allowHost()` に登録します。

エラーハンドリング:

- `StatusPages.kt` が重複タグ、入力検証、日付不正、CSRF、Turnstile、Resend、その他例外を JSON レスポンスに変換します。
- 問い合わせフォームの入力検証は `Validation.kt` にあります。

API 概要:

- Public:
  - `GET /api/blogs`
  - `GET /api/blogs/{slug}`
  - `GET /api/portfolios`
  - `GET /api/portfolios/{slug}`
  - `GET /api/tags`
  - `GET /api/ogp?url=...`
  - `POST /api/contact`
  - `POST /api/auth/login`
- Admin JWT required:
  - `GET/POST /api/admin/blogs`
  - `PUT/DELETE /api/admin/blogs/{slug}`
  - `GET/POST /api/admin/portfolios`
  - `PUT/DELETE /api/admin/portfolios/{slug}`
  - `GET/POST /api/admin/tags`
  - `PUT /api/admin/tags/order`
  - `PUT/DELETE /api/admin/tags/{id}`

## MCP サーバー

`mcp/` はブログ管理用の stdio MCP サーバーです。

`mcp/setup.sh` で Claude Code に `my-page-blog` という名前で user スコープ登録されます。
登録済みの環境では `mcp__my-page-blog__<ツール名>` を直接呼べるので、ブログの確認・作成・更新・削除はこれを使うのが最短です。

技術:

- TypeScript
- `@modelcontextprotocol/sdk`
- `zod`

設定解決:

- `BACKEND_URL`, `FRONTEND_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` を環境変数または macOS Keychain から読みます。
- 既定値は `BACKEND_URL=http://localhost:8080`, `FRONTEND_URL=http://localhost:3000`。
- Keychain service 名は `my-page-mcp`。

設計上の注意:

- 読み取りとログインは backend を直接呼びます。
- 作成/更新/削除は frontend の `/api/admin` プロキシを通します。これにより `revalidatePath()` が走り、公開ページのキャッシュが更新されます。
- JWT は backend/frontend と同じく `auth_token` cookie として送ります。
- CSRF 対策のため、`Origin` は `FRONTEND_URL` を使います。

提供ツール:

- `list_blogs`
- `get_blog`
- `create_blog`
- `update_blog`
- `delete_blog`

ブログの日付入力は `yyyy年M月d日` 形式です。

## テスト方針

変更範囲に応じて最低限以下を実行してください。

- frontend の表示・repository・proxy を変えた場合: `cd frontend && pnpm lint` または `pnpm check`
- frontend のビルドや Next.js 設定を変えた場合: `cd frontend && pnpm build`
- backend の routes/service/repository/db/security を変えた場合: `cd backend && ./gradlew :app:test`
- backend の Kotlin style を変えた場合: `cd backend && ./gradlew :app:ktlintCheck`
- MCP を変えた場合: `cd mcp && npm run build`

ネットワークや DB が必要な検証は、必要に応じて `docker-compose up` で backend/MySQL を起動してから実行してください。

## よくある変更時の確認リスト

ブログ API を変更するとき:

- backend の `BlogRoutes.kt`, `BlogService.kt`, `BlogRepository.kt`, DTO/schema/migration を確認。
- frontend の `blogRepository.ts`, `adminBlogRepository.ts`, hooks, admin form, public page を確認。
- MCP の `mcp/src/index.ts` が同じ API 契約で動くか確認。
- admin proxy の `revalidatePath()` 対象が足りているか確認。

ポートフォリオ API を変更するとき:

- backend の portfolio route/service/repository/schema/migration を確認。
- frontend の portfolio repository、admin portfolio hooks/form、public portfolio page を確認。
- 画像 URL を変える場合は `next.config.ts` の remotePatterns も確認。

タグ API を変更するとき:

- backend の `TagRoutes.kt`, `TagService.kt`, `TagRepository.kt` を確認。
- frontend の tag repository、検索 UI、管理画面、タグ並び替え画面を確認。
- タグ変更はブログ/ポートフォリオ一覧の再検証にも影響します。

認証や cookie を変更するとき:

- backend `Security.kt` は cookie 認証前提です。
- frontend `proxy.ts`, `api/auth/login/route.ts`, `api/admin/[...path]/route.ts` を同時に確認。
- MCP の `authedFetch()` も cookie 前提です。

問い合わせフォームを変更するとき:

- frontend の `ContactFormSection`, `useContactFormTop`, `contactFormRepository`, form validation を確認。
- backend の `ContactRoutes.kt`, `ContactService.kt`, `Validation.kt`, Turnstile/Resend 設定を確認。

## ドキュメント更新

設計・起動方法・環境変数・API 契約を変えた場合は、この `AGENTS.md` と必要に応じて `README.md` も更新してください。
