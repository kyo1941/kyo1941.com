#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const KEYCHAIN_SERVICE = "my-page-mcp";

/** macOS Keychain から汎用パスワード項目を読む。無い / macOS 以外なら undefined。 */
function fromKeychain(account: string): string | undefined {
  try {
    const out = execFileSync(
      "security",
      ["find-generic-password", "-s", KEYCHAIN_SERVICE, "-a", account, "-w"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    return out || undefined;
  } catch {
    return undefined;
  }
}

/** 設定値は 環境変数 > Keychain > 既定値 の順で解決する。 */
function resolveConfig(key: string): string | undefined {
  return process.env[key] ?? fromKeychain(key);
}

// 読み取り・ログインはバックエンドを直接叩く。
const BACKEND_URL = resolveConfig("BACKEND_URL") ?? "http://localhost:8080";
// 変更系(作成/更新/削除)はフロントエンドの /api/admin プロキシ経由にする。
// プロキシが backend へ転送しつつ revalidatePath() でブログページの静的キャッシュを
// 無効化するため、MCP からの変更も公開サイトに反映される。
const FRONTEND_URL = resolveConfig("FRONTEND_URL") ?? "http://localhost:3000";
// バックエンドの CSRF 保護は許可オリジンと一致する Origin ヘッダーを要求する。
// 許可オリジン(= CORS_ALLOWED_ORIGINS) はフロントのオリジンなので FRONTEND_URL を使う。
const ORIGIN = FRONTEND_URL;
const ADMIN_USERNAME = resolveConfig("ADMIN_USERNAME");
const ADMIN_PASSWORD = resolveConfig("ADMIN_PASSWORD");

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.error(
    "ADMIN_USERNAME と ADMIN_PASSWORD を環境変数に設定してください。",
  );
  process.exit(1);
}

/**
 * ログインして得た JWT をメモリにキャッシュする。
 * バックエンドの JWT には有効期限があるため、401 が返ったら破棄して再取得する。
 * 並行ツール呼び出し時に login() が重複しないよう、進行中の Promise も保持する。
 */
let cachedToken: string | null = null;
let loginPromise: Promise<string> | null = null;

async function login(): Promise<string> {
  if (loginPromise) return loginPromise;
  loginPromise = (async () => {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: ORIGIN },
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
      }),
    });
    if (!res.ok) {
      throw new Error(
        `ログインに失敗しました (HTTP ${res.status})。認証情報を確認してください。`,
      );
    }
    const data = (await res.json()) as { token?: string };
    if (!data.token) {
      throw new Error("ログインレスポンスに token が含まれていません。");
    }
    cachedToken = data.token;
    return data.token;
  })();
  try {
    return await loginPromise;
  } finally {
    loginPromise = null;
  }
}

/**
 * 認証付きで API を呼ぶ。401 のときはトークンを再取得して 1 度だけ再試行する。
 * バックエンドは JWT を Authorization ヘッダーではなく auth_token クッキーから読む
 * (Security.kt の authHeader 実装に合わせる)。フロントの管理プロキシも同じクッキーを
 * 転送するため、baseUrl が backend / frontend どちらでもこの形で動く。
 */
async function authedFetch(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const doFetch = (token: string) =>
    fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Origin: ORIGIN,
        Cookie: `auth_token=${token}`,
      },
    });

  let res = await doFetch(cachedToken ?? (await login()));
  if (res.status === 401) {
    cachedToken = null;
    res = await doFetch(await login());
  }
  return res;
}

/** ツールの戻り値を MCP のテキストコンテンツ形式に整える。 */
function textResult(value: unknown) {
  const text =
    typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return { content: [{ type: "text" as const, text }] };
}

function errorResult(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

const blogRequestShape = {
  title: z.string().describe("記事のタイトル"),
  date: z
    .string()
    .regex(
      /^\d{4}年\d{1,2}月\d{1,2}日$/,
      "形式は 'yyyy年M月d日' (例: 2026年6月17日) である必要があります",
    )
    .describe("記事の公開日。形式は 'yyyy年M月d日' (例: 2026年6月17日)"),
  description: z.string().describe("記事の概要"),
  tags: z.array(z.string()).describe("記事に関連付けるタグのリスト"),
  content: z.string().describe("記事の本文 (Markdown)"),
  isDraft: z.boolean().default(false).describe("下書きかどうか"),
};

const server = new McpServer({
  name: "my-page-blog",
  version: "1.0.0",
});

server.registerTool(
  "list_blogs",
  {
    title: "ブログ記事一覧",
    description:
      "ブログ記事の一覧を取得する（下書きを含む）。タグやキーワードで絞り込める。本文は含まないため、本文は get_blog で取得する。",
    inputSchema: {
      limit: z
        .number()
        .int()
        .positive()
        .max(100)
        .optional()
        .describe("取得件数の上限 (最大 100)"),
      tags: z.array(z.string()).optional().describe("絞り込むタグ"),
      keyword: z
        .string()
        .optional()
        .describe("検索キーワード（タイトルと概要を対象に部分一致。本文は対象外）"),
    },
  },
  async ({ limit, tags, keyword }) => {
    try {
      const params = new URLSearchParams();
      if (limit != null) params.set("limit", String(limit));
      if (keyword) params.set("keyword", keyword);
      for (const t of tags ?? []) params.append("tags", t);
      const qs = params.toString();
      const res = await authedFetch(
        BACKEND_URL,
        `/api/admin/blogs${qs ? `?${qs}` : ""}`,
      );
      if (!res.ok) {
        return errorResult(`記事一覧の取得に失敗しました (HTTP ${res.status})`);
      }
      return textResult(await res.json());
    } catch (e) {
      return errorResult(`エラー: ${(e as Error).message}`);
    }
  },
);

server.registerTool(
  "get_blog",
  {
    title: "ブログ記事取得",
    description: "slug を指定してブログ記事を 1 件取得する。",
    inputSchema: {
      slug: z.string().describe("記事のスラッグ"),
    },
  },
  async ({ slug }) => {
    try {
      const res = await authedFetch(
        BACKEND_URL,
        `/api/blogs/${encodeURIComponent(slug)}`,
      );
      if (res.status === 404) {
        return errorResult(`記事が見つかりません: ${slug}`);
      }
      if (!res.ok) {
        return errorResult(`記事の取得に失敗しました (HTTP ${res.status})`);
      }
      return textResult(await res.json());
    } catch (e) {
      return errorResult(`エラー: ${(e as Error).message}`);
    }
  },
);

server.registerTool(
  "create_blog",
  {
    title: "ブログ記事作成",
    description: "新しいブログ記事を作成する。",
    inputSchema: blogRequestShape,
  },
  async (args) => {
    try {
      const res = await authedFetch(FRONTEND_URL, "/api/admin/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      if (!res.ok) {
        return errorResult(`記事の作成に失敗しました (HTTP ${res.status})`);
      }
      return textResult(await res.json());
    } catch (e) {
      return errorResult(`エラー: ${(e as Error).message}`);
    }
  },
);

server.registerTool(
  "update_blog",
  {
    title: "ブログ記事更新",
    description: "slug を指定して既存のブログ記事を更新する。",
    inputSchema: {
      slug: z.string().describe("更新対象の記事のスラッグ"),
      ...blogRequestShape,
    },
  },
  async ({ slug, ...body }) => {
    try {
      const res = await authedFetch(
        FRONTEND_URL,
        `/api/admin/blogs/${encodeURIComponent(slug)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (res.status === 404) {
        return errorResult(`記事が見つかりません: ${slug}`);
      }
      if (!res.ok) {
        return errorResult(`記事の更新に失敗しました (HTTP ${res.status})`);
      }
      return textResult(await res.json());
    } catch (e) {
      return errorResult(`エラー: ${(e as Error).message}`);
    }
  },
);

server.registerTool(
  "delete_blog",
  {
    title: "ブログ記事削除",
    description: "slug を指定してブログ記事を削除する。",
    inputSchema: {
      slug: z.string().describe("削除対象の記事のスラッグ"),
    },
  },
  async ({ slug }) => {
    try {
      const res = await authedFetch(
        FRONTEND_URL,
        `/api/admin/blogs/${encodeURIComponent(slug)}`,
        { method: "DELETE" },
      );
      if (res.status === 404) {
        return errorResult(`記事が見つかりません: ${slug}`);
      }
      if (!res.ok) {
        return errorResult(`記事の削除に失敗しました (HTTP ${res.status})`);
      }
      return textResult(`記事を削除しました: ${slug}`);
    } catch (e) {
      return errorResult(`エラー: ${(e as Error).message}`);
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("my-page-blog MCP server running");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
