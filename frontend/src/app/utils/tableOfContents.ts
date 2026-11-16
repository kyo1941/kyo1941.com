import { parseToggleSegments, type ToggleNode } from "./preprocessToggles";

export const TABLE_OF_CONTENTS_MIN_HEADINGS = 2;

const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const HEADING = /^ {0,3}#{1,4}(\s|$)/;

function headingCountIn(markdown: string) {
  let fence: string | undefined;
  let count = 0;
  for (const line of markdown.split("\n")) {
    const opening = line.match(FENCE)?.[1];
    if (fence) {
      if (opening?.[0] === fence[0] && opening.length >= fence.length) {
        fence = undefined;
      }
      continue;
    }
    if (opening) {
      fence = opening;
      continue;
    }
    if (HEADING.test(line)) count++;
  }
  return count;
}

function headingCountOf(segments: ToggleNode[]): number {
  return segments.reduce(
    (count, segment) =>
      count +
      (segment.type === "toggle"
        ? headingCountOf(segment.children)
        : headingCountIn(segment.content)),
    0,
  );
}

// 目次の見出しは表示後に本文から集めるが、目次の列を置くかは最初の表示で決めないと本文の位置がずれるため、記事の Markdown から先に数える
export function hasTableOfContents(markdown: string) {
  return (
    headingCountOf(parseToggleSegments(markdown)) >=
    TABLE_OF_CONTENTS_MIN_HEADINGS
  );
}
