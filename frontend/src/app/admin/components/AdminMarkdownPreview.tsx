"use client";

import { useOgpData } from "@/app/hooks/admin/useOgpData";
import { MarkdownRenderer } from "@/app/components/MarkdownRenderer";
import { SOURCE_LINE_ATTRIBUTE } from "@/app/utils/rehypeSourceLine";

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
      <aside className="self-start rounded border bg-surface p-6 shadow lg:sticky lg:top-8 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
        <div
          className="prose max-w-none dark:prose-invert"
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
