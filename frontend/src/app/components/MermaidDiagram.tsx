"use client";

import { useEffect, useId, useState } from "react";
import { useDisplayedTheme } from "@/app/hooks/useDisplayedTheme";
import { CodeBlock } from "@/app/components/CodeBlock";
import type { Theme } from "@/app/utils/chosenTheme";

type Props = {
  source: string;
};

type Diagram = { status: "drawn"; svg: string } | { status: "invalid" };

// 編集中はトグルの増減などで図が作り直されることがあり、そのたびに描き直すと描画が終わるまで図が消えるため、最近の結果を覚えて即座に出す。
const recentDiagrams = new Map<string, Diagram>();
const RECENT_DIAGRAM_LIMIT = 50;

function diagramKey(theme: Theme, source: string) {
  return `${theme}\n${source}`;
}

function remember(key: string, diagram: Diagram) {
  recentDiagrams.delete(key);
  recentDiagrams.set(key, diagram);
  if (recentDiagrams.size > RECENT_DIAGRAM_LIMIT) {
    const oldest = recentDiagrams.keys().next().value;
    if (oldest !== undefined) recentDiagrams.delete(oldest);
  }
}

export function MermaidDiagram({ source }: Props) {
  // mermaid はこの id を図のスタイルの CSS セレクタにも使うため、セレクタで使えない文字を落とす
  const id = `mermaid-${useId().replace(/[^\w-]/g, "")}`;
  const theme = useDisplayedTheme();
  // 記法を書き換えている間は、新しい図ができるまで直前の図を出しておく
  const [latest, setLatest] = useState<Diagram>();
  const diagram =
    (theme && recentDiagrams.get(diagramKey(theme, source))) ?? latest;

  useEffect(() => {
    if (!theme) return;
    const key = diagramKey(theme, source);
    if (recentDiagrams.has(key)) return;
    let cancelled = false;
    const settle = (result: Diagram) => {
      if (!cancelled) setLatest(result);
    };
    (async () => {
      try {
        const { default: mermaid } = await import("mermaid");
        mermaid.initialize({
          startOnLoad: false,
          theme: theme === "dark" ? "dark" : "default",
        });
        // 書きかけの記法を render に渡すとエラー表示の図が body に残るため、先に検証して弾く
        const valid = await mermaid.parse(source, { suppressErrors: true });
        if (!valid) {
          remember(key, { status: "invalid" });
          settle({ status: "invalid" });
          return;
        }
        const { svg } = await mermaid.render(id, source);
        remember(key, { status: "drawn", svg });
        settle({ status: "drawn", svg });
      } catch {
        // 読み込みの失敗は一時的なことがあるため、覚えずに次の機会に描き直させる
        settle({ status: "invalid" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, source, theme]);

  if (diagram?.status === "invalid") {
    return (
      <CodeBlock language="mermaid">
        <code>{source}</code>
      </CodeBlock>
    );
  }

  if (!diagram) {
    return <div className="my-4 min-h-24" aria-busy="true" />;
  }

  return (
    <div
      className="my-4 flex justify-center overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: diagram.svg }}
    />
  );
}
