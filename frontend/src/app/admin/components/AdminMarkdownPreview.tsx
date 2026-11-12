"use client";

import { useOgpData } from "@/app/hooks/admin/useOgpData";
import { MarkdownRenderer } from "@/app/components/MarkdownRenderer";
import { SOURCE_LINE_ATTRIBUTE } from "@/app/utils/rehypeSourceLine";
import { tagNamesShownAsText } from "@/app/utils/remarkArticleHtml";

type AdminMarkdownPreviewProps = {
  content: string;
  onSourceLineSelect: (line: number) => void;
};

export function AdminMarkdownPreview({
  content,
  onSourceLineSelect,
}: AdminMarkdownPreviewProps) {
  const hasContent = content.trim().length > 0;
  const ogpData = useOgpData(content);
  const textTagNames = tagNamesShownAsText(content);

  // ダブルクリックで本文の行へ移るとき、1回目のクリックでリンク先へ移動してしまわないよう、プレビューではリンクを開かない
  const handleClick = (e: React.MouseEvent) => {
    if (e.target instanceof Element && e.target.closest("a")) {
      e.preventDefault();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!(e.target instanceof Element)) return;
    const block = e.target.closest(`[${SOURCE_LINE_ATTRIBUTE}]`);
    if (!block) return;
    const line = Number(block.getAttribute(SOURCE_LINE_ATTRIBUTE));
    if (!Number.isInteger(line)) return;
    window.getSelection()?.removeAllRanges();
    onSourceLineSelect(line);
  };

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">プレビュー</h2>
      {textTagNames.length > 0 && (
        <p className="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          {textTagNames.map((name) => `<${name}>`).join(" ")} は記事で使える
          HTML タグではないため、文字として表示しています。
        </p>
      )}
      <aside className="self-start rounded border bg-surface p-6 shadow lg:sticky lg:top-8 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
        <div
          className="prose max-w-none dark:prose-invert"
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          {hasContent ? (
            <MarkdownRenderer
              content={content}
              ogpData={ogpData}
              markSourceLines
            />
          ) : (
            <p className="text-sm text-gray-500">
              本文を入力するとここにプレビューが表示されます。
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
