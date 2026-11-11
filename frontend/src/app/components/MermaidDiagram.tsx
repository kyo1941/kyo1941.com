"use client";

import { useEffect, useState } from "react";
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

let drawCount = 0;

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
  const theme = useDisplayedTheme();
  // 記法を書き換えている間は、新しい図ができるまで最後に出した図を出しておく
  const [lastShown, setLastShown] = useState<Diagram>();
  const remembered = theme
    ? recentDiagrams.get(diagramKey(theme, source))
    : undefined;
  if (remembered && remembered !== lastShown) {
    setLastShown(remembered);
  }
  const diagram = remembered ?? lastShown;

  useEffect(() => {
    if (!theme) return;
    const key = diagramKey(theme, source);
    if (recentDiagrams.has(key)) return;
    let cancelled = false;
    const settle = (result: Diagram) => {
      if (!cancelled) setLastShown(result);
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
          const invalid: Diagram = { status: "invalid" };
          remember(key, invalid);
          settle(invalid);
          return;
        }
        // mermaid は描き始めに同じ id の要素を消すため、表示中の図を残したまま描けるよう毎回別の id にする
        const { svg } = await mermaid.render(`mermaid-${++drawCount}`, source);
        const drawn: Diagram = { status: "drawn", svg };
        remember(key, drawn);
        settle(drawn);
      } catch {
        // 読み込みの失敗は一時的なことがあるため、覚えずに次の機会に描き直させる
        settle({ status: "invalid" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source, theme]);

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
