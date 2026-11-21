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

type CodeFence = { marker: string; length: number };

function codeFenceOpenedBy(line: string): CodeFence | null {
  const match = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
  if (!match) return null;
  const [, fence, info] = match;
  if (fence[0] === "`" && info.includes("`")) return null;
  return { marker: fence[0], length: fence.length };
}

function closesCodeFence(line: string, fence: CodeFence): boolean {
  const match = line.match(/^ {0,3}(`{3,}|~{3,})\s*$/);
  return (
    match !== null &&
    match[1][0] === fence.marker &&
    match[1].length >= fence.length
  );
}

function nextCodeFence(line: string, open: CodeFence | null) {
  if (open) return closesCodeFence(line, open) ? null : open;
  return codeFenceOpenedBy(line);
}

function toggleOpenedBy(
  line: string,
): { colons: number; title: string } | null {
  const match = line.match(/^(:{3,})details(?:\s+(.*?))?\s*$/);
  return match ? { colons: match[1].length, title: match[2] ?? "" } : null;
}

function closingLineIndex(lines: string[], start: number, colons: number) {
  let fence: CodeFence | null = null;
  for (let i = start; i < lines.length; i++) {
    const match = lines[i].match(/^(:{3,})\s*$/);
    if (!fence && match && match[1].length >= colons) return i;
    fence = nextCodeFence(lines[i], fence);
  }
  return lines.length;
}

function parseLines(lines: string[], firstLine: number): ToggleNode[] {
  const segments: ToggleNode[] = [];
  let markdownLines: string[] = [];
  let markdownFirstLine = firstLine;
  let fence: CodeFence | null = null;

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
    const toggle = fence ? null : toggleOpenedBy(lines[i]);
    if (toggle) {
      flushMarkdown();
      const bodyStart = i + 1;
      const bodyEnd = closingLineIndex(lines, bodyStart, toggle.colons);
      segments.push({
        type: "toggle",
        title: toggle.title,
        titleLine: firstLine + i,
        children: parseLines(
          lines.slice(bodyStart, bodyEnd),
          firstLine + bodyStart,
        ),
      });
      i = bodyEnd + 1;
      continue;
    }

    fence = nextCodeFence(lines[i], fence);
    if (markdownLines.length === 0) markdownFirstLine = firstLine + i;
    markdownLines.push(lines[i]);
    i++;
  }

  flushMarkdown();
  return segments;
}

export function parseToggleSegments(markdown: string): ToggleNode[] {
  return parseLines(markdown.split("\n"), 1);
}
