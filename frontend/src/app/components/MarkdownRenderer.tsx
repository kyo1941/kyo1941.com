import React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import type { OgpData } from "@/app/types/ogp";
import {
  linkPreviewOgp,
  remarkLinkPreview,
} from "@/app/utils/remarkLinkPreview";
import {
  parseToggleSegments,
  type ToggleNode,
} from "@/app/utils/preprocessToggles";
import { rehypeSourceLine, sourceLineOf } from "@/app/utils/rehypeSourceLine";
import { remarkArticleHtml } from "@/app/utils/remarkArticleHtml";
import { LinkPreviewCard } from "@/app/components/LinkPreviewCard";
import { CodeBlock } from "@/app/components/CodeBlock";
import { MermaidDiagram } from "@/app/components/MermaidDiagram";

type Props = {
  content: string;
  ogpData?: Record<string, OgpData>;
  markSourceLines?: boolean;
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

function SourceLineBlock({
  line,
  children,
}: {
  line: number | undefined;
  children: React.ReactNode;
}) {
  if (line === undefined) return children;
  return (
    <div className="contents" data-source-line={line}>
      {children}
    </div>
  );
}

const components: Components = {
  pre({ children, ...props }) {
    const line = sourceLineOf(props);
    const codeElement = React.Children.toArray(children).find(
      (child) =>
        React.isValidElement(child) &&
        (child as React.ReactElement).type === "code",
    ) as React.ReactElement<{ className?: string }> | undefined;
    const language = codeElement?.props.className?.match(/language-(\S+)/)?.[1];
    if (language?.toLowerCase() === "mermaid") {
      return (
        <SourceLineBlock line={line}>
          <MermaidDiagram source={textOf(children)} />
        </SourceLineBlock>
      );
    }
    return (
      <SourceLineBlock line={line}>
        <CodeBlock language={language}>{children}</CodeBlock>
      </SourceLineBlock>
    );
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  p({ children, node, ...props }) {
    const ogp = linkPreviewOgp(props);
    if (ogp) {
      return (
        <SourceLineBlock line={sourceLineOf(props)}>
          <LinkPreviewCard data={ogp} />
        </SourceLineBlock>
      );
    }
    return <p {...props}>{children}</p>;
  },
};

function MarkdownContent({
  content,
  firstLine,
  ogpData,
  markSourceLines,
}: {
  content: string;
  firstLine: number;
  ogpData: Record<string, OgpData>;
  markSourceLines: boolean;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[
        remarkGfm,
        remarkArticleHtml,
        [remarkLinkPreview, { ogpData }],
      ]}
      rehypePlugins={
        markSourceLines
          ? [rehypeHighlight, rehypeRaw, [rehypeSourceLine, { firstLine }]]
          : [rehypeHighlight, rehypeRaw]
      }
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}

function SegmentRenderer({
  segment,
  ogpData,
  markSourceLines,
}: {
  segment: ToggleNode;
  ogpData: Record<string, OgpData>;
  markSourceLines: boolean;
}) {
  if (segment.type === "toggle") {
    return (
      <details className="toggle">
        <summary
          data-source-line={markSourceLines ? segment.titleLine : undefined}
        >
          {segment.title}
        </summary>
        {segment.children.map((child, i) => (
          <SegmentRenderer
            key={i}
            segment={child}
            ogpData={ogpData}
            markSourceLines={markSourceLines}
          />
        ))}
      </details>
    );
  }
  return (
    <MarkdownContent
      content={segment.content}
      firstLine={segment.firstLine}
      ogpData={ogpData}
      markSourceLines={markSourceLines}
    />
  );
}

export function MarkdownRenderer({
  content,
  ogpData = {},
  markSourceLines = false,
}: Props) {
  const segments = parseToggleSegments(content);
  return (
    <div>
      {segments.map((seg, i) => (
        <SegmentRenderer
          key={i}
          segment={seg}
          ogpData={ogpData}
          markSourceLines={markSourceLines}
        />
      ))}
    </div>
  );
}
