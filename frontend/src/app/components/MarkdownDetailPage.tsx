import PageShell from "@/app/components/PageShell";
import BackButton from "@/app/components/BackButton";
import { MarkdownRenderer } from "@/app/components/MarkdownRenderer";
import { TableOfContents } from "@/app/components/TableOfContents";
import type { OgpData } from "@/app/types/ogp";

type MarkdownDetailData = {
  title: string;
  date: string;
  content: string;
};

const ARTICLE_BODY_ID = "article-body";

type MarkdownDetailPageProps = {
  data: MarkdownDetailData | null;
  ogpData: Record<string, OgpData>;
  fallbackPath: string;
  notFoundMessage: string;
};

/** ブログ・ポートフォリオの個別記事ページ共通のレイアウト */
export function MarkdownDetailPage({
  data,
  ogpData,
  fallbackPath,
  notFoundMessage,
}: MarkdownDetailPageProps) {
  if (!data) {
    return (
      <PageShell>
        <div className="sky-surface p-12 text-center">
          <div className="mb-8 text-left">
            <BackButton fallbackPath={fallbackPath} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {notFoundMessage}
            <br />
            お探しのページは存在しないか、削除された可能性があります。
          </h1>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell aside={<TableOfContents articleBodyId={ARTICLE_BODY_ID} />}>
      {/* 長文を読ませるページなので、可読性を優先してサーフェス（背景）をつける。
          戻るボタンもサーフェス外に置かず、同じ読みやすい面の中に含める */}
      <article className="sky-surface p-8 sm:p-12">
        <div className="mb-8">
          <BackButton fallbackPath={fallbackPath} />
        </div>

        <h1 className="text-4xl font-bold mb-4 text-gray-900">{data.title}</h1>

        <div className="text-gray-600 mb-8">{data.date}</div>

        {/* 固定ヘッダーに見出しが隠れないよう、見出しへ移動したときはヘッダーの下で止める */}
        <div
          id={ARTICLE_BODY_ID}
          className="prose prose-lg max-w-none dark:prose-invert [&_:is(h1,h2,h3,h4)]:scroll-mt-[calc(var(--header-height)+var(--content-top-gap))]"
        >
          <MarkdownRenderer content={data.content} ogpData={ogpData} />
        </div>
      </article>
    </PageShell>
  );
}
