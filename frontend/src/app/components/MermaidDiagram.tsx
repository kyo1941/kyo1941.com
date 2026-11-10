"use client";

import { useEffect, useId, useState } from "react";
import { useDisplayedTheme } from "@/app/hooks/useDisplayedTheme";
import { CodeBlock } from "@/app/components/CodeBlock";

type Props = {
  source: string;
};

type Diagram =
  | { status: "drawing" }
  | { status: "drawn"; svg: string }
  | { status: "invalid" };

export function MermaidDiagram({ source }: Props) {
  // mermaid はこの id を図のスタイルの CSS セレクタにも使うため、セレクタで使えない文字を落とす
  const id = `mermaid-${useId().replace(/[^\w-]/g, "")}`;
  const theme = useDisplayedTheme();
  const [diagram, setDiagram] = useState<Diagram>({ status: "drawing" });

  useEffect(() => {
    if (!theme) return;
    let cancelled = false;
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
          if (!cancelled) setDiagram({ status: "invalid" });
          return;
        }
        const { svg } = await mermaid.render(id, source);
        if (!cancelled) setDiagram({ status: "drawn", svg });
      } catch {
        if (!cancelled) setDiagram({ status: "invalid" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, source, theme]);

  if (diagram.status === "invalid") {
    return (
      <CodeBlock language="mermaid">
        <code>{source}</code>
      </CodeBlock>
    );
  }

  if (diagram.status === "drawing") {
    return <div className="my-4 min-h-24" aria-busy="true" />;
  }

  return (
    <div
      className="my-4 flex justify-center overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: diagram.svg }}
    />
  );
}
