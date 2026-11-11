import React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import type { OgpData } from "@/app/types/ogp";
import { remarkLinkPreview } from "@/app/utils/remarkLinkPreview";
import {
  parseToggleSegments,
  type ToggleNode,
} from "@/app/utils/preprocessToggles";
import { LinkPreviewCard } from "@/app/components/LinkPreviewCard";
import { CodeBlock } from "@/app/components/CodeBlock";
import { MermaidDiagram } from "@/app/components/MermaidDiagram";

type Props = {
  content: string;
  ogpData?: Record<string, OgpData>;
};

function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(textOf).join("");
  }
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return textOf(node.props.children);
  }
  return "";
}

const NO_OGP_DATA: Record<string, OgpData> = {};

// react-markdown は components の関数をそのまま要素の型に使うため、描画のたびに作り直すと配下がすべて作り直される。
// 編集中のプレビューで図やリンクカードが毎回消えて描き直されないよう、同じ OGP データには同じ関数を返す。
const componentsByOgpData = new WeakMap<Record<string, OgpData>, Components>();

function markdownComponents(ogpData: Record<string, OgpData>): Components {
  const cached = componentsByOgpData.get(ogpData);
  if (cached) return cached;
  const components: Components = {
    pre({ children }) {
      const codeElement = React.Children.toArray(children).find(
        (child) =>
          React.isValidElement(child) &&
          (child as React.ReactElement).type === "code",
      ) as React.ReactElement<{ className?: string }> | undefined;
      const language =
        codeElement?.props.className?.match(/language-(\S+)/)?.[1];
      if (language?.toLowerCase() === "mermaid") {
        return <MermaidDiagram source={textOf(children)} />;
      }
      return <CodeBlock language={language}>{children}</CodeBlock>;
    },
    p({ children, ...props }) {
      const previewUrl = (props as Record<string, unknown>)[
        "data-link-preview"
      ] as string | undefined;

      if (previewUrl) {
        const data = ogpData[previewUrl];
        if (data) {
          return <LinkPreviewCard data={data} />;
        }
      }

      return <p {...props}>{children}</p>;
    },
  };
  componentsByOgpData.set(ogpData, components);
  return components;
}

function MarkdownContent({
  content,
  ogpData,
}: {
  content: string;
  ogpData: Record<string, OgpData>;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkLinkPreview]}
      rehypePlugins={[rehypeHighlight, rehypeRaw]}
      components={markdownComponents(ogpData)}
    >
      {content}
    </ReactMarkdown>
  );
}

function SegmentRenderer({
  segment,
  ogpData,
}: {
  segment: ToggleNode;
  ogpData: Record<string, OgpData>;
}) {
  if (segment.type === "toggle") {
    return (
      <details className="toggle">
        <summary>{segment.title}</summary>
        {segment.children.map((child, i) => (
          <SegmentRenderer key={i} segment={child} ogpData={ogpData} />
        ))}
      </details>
    );
  }
  return <MarkdownContent content={segment.content} ogpData={ogpData} />;
}

export function MarkdownRenderer({ content, ogpData = NO_OGP_DATA }: Props) {
  const segments = parseToggleSegments(content);
  return (
    <div>
      {segments.map((seg, i) => (
        <SegmentRenderer key={i} segment={seg} ogpData={ogpData} />
      ))}
    </div>
  );
}
