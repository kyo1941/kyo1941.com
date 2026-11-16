import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
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
  headingIdsBySegment: Record<number, string[]>;
};

export const TABLE_OF_CONTENTS_MIN_HEADINGS = 2;
const DEEPEST_LEVEL = 4;

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
export function articleOutline(
  markdown: string,
  reservedIds: string[],
): ArticleOutline {
  const used = new Set(reservedIds);
  const headings: OutlineHeading[] = [];
  const headingIdsBySegment: Record<number, string[]> = {};
  for (const segment of markdownSegmentsOf(parseToggleSegments(markdown))) {
    const tree = parser.parse(segment.content) as Root;
    const ids: string[] = [];
    visit(tree, "heading", (heading) => {
      if (heading.depth > DEEPEST_LEVEL) return;
      const text = textOf(heading);
      const id = headingId(text, used);
      ids.push(id);
      headings.push({ id, text, level: heading.depth });
    });
    headingIdsBySegment[segment.firstLine] = ids;
  }
  return { headings, headingIdsBySegment };
}
