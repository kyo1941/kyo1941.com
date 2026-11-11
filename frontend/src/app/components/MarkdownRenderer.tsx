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

const components: Components = {
  pre({ children }) {
    const codeElement = React.Children.toArray(children).find(
      (child) =>
        React.isValidElement(child) &&
        (child as React.ReactElement).type === "code",
    ) as React.ReactElement<{ className?: string }> | undefined;
    const language = codeElement?.props.className?.match(/language-(\S+)/)?.[1];
    if (language?.toLowerCase() === "mermaid") {
      return <MermaidDiagram source={textOf(children)} />;
    }
    return <CodeBlock language={language}>{children}</CodeBlock>;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  p({ children, node, ...props }) {
    const ogp = linkPreviewOgp(props);
    if (ogp) {
      return <LinkPreviewCard data={ogp} />;
    }
    return <p {...props}>{children}</p>;
  },
};

function MarkdownContent({
  content,
  ogpData,
}: {
  content: string;
  ogpData: Record<string, OgpData>;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, [remarkLinkPreview, { ogpData }]]}
      rehypePlugins={[rehypeHighlight, rehypeRaw]}
      components={components}
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

export function MarkdownRenderer({ content, ogpData = {} }: Props) {
  const segments = parseToggleSegments(content);
  return (
    <div>
      {segments.map((seg, i) => (
        <SegmentRenderer key={i} segment={seg} ogpData={ogpData} />
      ))}
    </div>
  );
}
