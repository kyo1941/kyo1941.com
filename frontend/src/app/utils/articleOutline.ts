import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { SKIP, visit } from "unist-util-visit";
import type { Nodes, Root } from "mdast";
import {
  parseToggleSegments,
  type MarkdownSegment,
  type ToggleNode,
} from "./preprocessToggles";

export type OutlineHeading = {
  id: string;
  text: string;
  level: number;
};

export type ArticleOutline = {
  headings: OutlineHeading[];
  headingIdsBySegment: Record<number, Record<number, string>>;
};

export const TABLE_OF_CONTENTS_MIN_HEADINGS = 2;
const DEEPEST_LEVEL = 4;
// 脚注の見出しには描画のときにこの id が付くため、記事の見出しの id と重ならないようにする
const FOOTNOTE_LABEL_ID = "footnote-label";

const parser = unified().use(remarkParse).use(remarkGfm);

function textOf(node: Nodes): string {
  if ("value" in node) return node.value;
  if ("children" in node) return node.children.map(textOf).join("");
  return "";
}

function markdownSegmentsOf(nodes: ToggleNode[]): MarkdownSegment[] {
  return nodes.flatMap((node) =>
    node.type === "toggle" ? markdownSegmentsOf(node.children) : [node],
  );
}

function headingId(text: string, used: Set<string>) {
  const base = text.trim().replace(/\s+/g, "-") || "section";
  let id = base;
  for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
  used.add(id);
  return id;
}

// 本文はトグルごとに分けて描画するため、同じ文字の見出しを記事全体で区別できるよう、描画の前に記事全体から見出しと id を決めておく
// 描画では脚注が末尾へ移るなど見出しの並びが変わるため、id は並び順ではなく Markdown 上の位置で見出しに結びつける
export function articleOutline(
  markdown: string,
  reservedIds: string[],
): ArticleOutline {
  const used = new Set([...reservedIds, FOOTNOTE_LABEL_ID]);
  const headings: OutlineHeading[] = [];
  const headingIdsBySegment: Record<number, Record<number, string>> = {};
  for (const segment of markdownSegmentsOf(parseToggleSegments(markdown))) {
    const tree = parser.parse(segment.content) as Root;
    const ids: Record<number, string> = {};
    visit(tree, (node) => {
      // 脚注は本文の末尾にまとめて表示され、本文の流れの見出しではないため目次に含めない
      if (node.type === "footnoteDefinition") return SKIP;
      if (node.type !== "heading" || node.depth > DEEPEST_LEVEL) return;
      const offset = node.position?.start.offset;
      if (offset === undefined) return;
      const text = textOf(node);
      const id = headingId(text, used);
      ids[offset] = id;
      headings.push({ id, text, level: node.depth });
    });
    headingIdsBySegment[segment.firstLine] = ids;
  }
  return { headings, headingIdsBySegment };
}
