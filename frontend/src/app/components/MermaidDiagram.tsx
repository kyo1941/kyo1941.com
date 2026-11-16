"use client";

import { useEffect, useRef, useState } from "react";
import { useDisplayedTheme } from "@/app/hooks/useDisplayedTheme";
import { CodeBlock } from "@/app/components/CodeBlock";
import type { Theme } from "@/app/utils/chosenTheme";

type Props = {
  source: string;
  enlargeable?: boolean;
};

type Diagram =
  | { status: "drawn"; svg: string; id: string }
  | { status: "invalid" };

// 編集中はトグルの増減などで図が作り直されることがあり、そのたびに描き直すと描画が終わるまで図が消えるため、最近の結果を覚えて即座に出す。
const recentDiagrams = new Map<string, Diagram>();
const RECENT_DIAGRAM_LIMIT = 50;

let drawCount = 0;

function diagramKey(theme: Theme, source: string) {
  return `${theme}\n${source}`;
}

// mermaid は図の中の id をすべて描画時の id から作るため、拡大用に並べる図ではその部分を差し替えて、記事の中の図と id が重ならないようにする
function enlargedSvg(svg: string, id: string) {
  return svg.replace(new RegExp(`${id}(?![0-9])`, "g"), `${id}-enlarged`);
}

// 画面幅いっぱいに広げると、細長い図は何倍にもなって読み進めるのに大きすぎるため、文字が読みやすくなる程度で止める
const ENLARGED_SCALE_LIMIT = 2;

function enlargedWidthLimit(svg: string) {
  const width = Number(
    svg.match(/viewBox="[^"\s]+\s+[^"\s]+\s+([^"\s]+)/)?.[1],
  );
  return Number.isFinite(width) ? width * ENLARGED_SCALE_LIMIT : undefined;
}

function remember(key: string, diagram: Diagram) {
  recentDiagrams.delete(key);
  recentDiagrams.set(key, diagram);
  if (recentDiagrams.size > RECENT_DIAGRAM_LIMIT) {
    const oldest = recentDiagrams.keys().next().value;
    if (oldest !== undefined) recentDiagrams.delete(oldest);
  }
}

export function MermaidDiagram({ source, enlargeable = false }: Props) {
  const theme = useDisplayedTheme();
  const enlargedView = useRef<HTMLDialogElement>(null);
  const [enlarged, setEnlarged] = useState(false);
  // 記法を書き換えている間は、新しい図ができるまで最後に出した図を出しておく
  const [lastShown, setLastShown] = useState<Diagram>();
  const remembered = theme
    ? recentDiagrams.get(diagramKey(theme, source))
    : undefined;
  if (remembered && remembered !== lastShown) {
    setLastShown(remembered);
  }

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
        const id = `mermaid-${++drawCount}`;
        const { svg } = await mermaid.render(id, source);
        const drawn: Diagram = { status: "drawn", svg, id };
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

  useEffect(() => {
    if (enlarged) enlargedView.current?.showModal();
  }, [enlarged]);

  if (lastShown?.status === "invalid") {
    return (
      <CodeBlock language="mermaid">
        <code>{source}</code>
      </CodeBlock>
    );
  }

  if (!lastShown) {
    return <div className="my-4 min-h-24" aria-busy="true" />;
  }

  if (!enlargeable) {
    return (
      <div
        className="my-4 flex justify-center overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: lastShown.svg }}
      />
    );
  }

  return (
    <div className="my-4 overflow-x-auto">
      <button
        type="button"
        aria-label="図を拡大する"
        className="flex w-full cursor-zoom-in justify-center"
        onClick={() => setEnlarged(true)}
      >
        <span
          className="contents"
          dangerouslySetInnerHTML={{ __html: lastShown.svg }}
        />
      </button>
      <dialog
        ref={enlargedView}
        aria-label="拡大した図"
        className="m-auto max-h-[90vh] w-[92vw] max-w-none cursor-zoom-out overflow-y-auto rounded bg-surface p-4 backdrop:bg-black/70"
        onClick={() => enlargedView.current?.close()}
        onClose={() => setEnlarged(false)}
      >
        {enlarged && (
          <span
            className="mx-auto block [&_svg]:h-auto [&_svg]:w-full [&_svg]:!max-w-none"
            style={{ maxWidth: enlargedWidthLimit(lastShown.svg) }}
            dangerouslySetInnerHTML={{
              __html: enlargedSvg(lastShown.svg, lastShown.id),
            }}
          />
        )}
      </dialog>
    </div>
  );
}
