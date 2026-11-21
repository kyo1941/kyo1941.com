import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";

export type MarkdownSegment = {
  type: "markdown";
  content: string;
  firstLine: number;
};
export type ToggleSegment = {
  type: "toggle";
  title: string;
  titleLine: number;
  children: ToggleNode[];
};
export type ToggleNode = MarkdownSegment | ToggleSegment;

const parser = unified().use(remarkParse).use(remarkGfm);

function codeLinesOf(markdown: string): Set<number> {
  const lines = new Set<number>();
  visit(parser.parse(markdown), "code", (node) => {
    const { start, end } = node.position ?? {};
    if (!start || !end) return;
    for (let line = start.line; line <= end.line; line++) lines.add(line);
  });
  return lines;
}

function toggleOpenedBy(
  line: string,
): { colons: number; title: string } | null {
  const match = line.match(/^(:{3,})details(?:\s+(.*?))?\s*$/);
  return match ? { colons: match[1].length, title: match[2] ?? "" } : null;
}

function closesToggle(line: string, colons: number): boolean {
  const match = line.match(/^(:{3,})\s*$/);
  return match !== null && match[1].length >= colons;
}

function parseLines(
  lines: string[],
  firstLine: number,
  codeLines: Set<number>,
): ToggleNode[] {
  const segments: ToggleNode[] = [];
  let markdownLines: string[] = [];
  let markdownFirstLine = firstLine;
  const isCode = (index: number) => codeLines.has(firstLine + index);

  const flushMarkdown = () => {
    if (markdownLines.length === 0) return;
    segments.push({
      type: "markdown",
      content: markdownLines.join("\n"),
      firstLine: markdownFirstLine,
    });
    markdownLines = [];
  };

  let i = 0;
  while (i < lines.length) {
    const toggle = isCode(i) ? null : toggleOpenedBy(lines[i]);
    if (toggle) {
      flushMarkdown();
      const bodyStart = i + 1;
      let bodyEnd = bodyStart;
      while (
        bodyEnd < lines.length &&
        (isCode(bodyEnd) || !closesToggle(lines[bodyEnd], toggle.colons))
      ) {
        bodyEnd++;
      }
      segments.push({
        type: "toggle",
        title: toggle.title,
        titleLine: firstLine + i,
        children: parseLines(
          lines.slice(bodyStart, bodyEnd),
          firstLine + bodyStart,
          codeLines,
        ),
      });
      i = bodyEnd + 1;
      continue;
    }

    if (markdownLines.length === 0) markdownFirstLine = firstLine + i;
    markdownLines.push(lines[i]);
    i++;
  }

  flushMarkdown();
  return segments;
}

export function parseToggleSegments(markdown: string): ToggleNode[] {
  return parseLines(markdown.split("\n"), 1, codeLinesOf(markdown));
}
