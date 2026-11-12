import { unified, type Plugin } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import type { Root, Html } from "mdast";
import {
  parseToggleSegments,
  type ToggleNode,
} from "@/app/utils/preprocessToggles";

// 型引数の Flow<T> のように、タグの形をしているだけの文字列まで HTML として消えないよう、記事で使う HTML タグを小文字で書いたものだけに絞る
const ARTICLE_HTML_TAGS = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "del",
  "details",
  "div",
  "em",
  "figcaption",
  "figure",
  "hr",
  "i",
  "iframe",
  "img",
  "ins",
  "kbd",
  "li",
  "mark",
  "ol",
  "p",
  "pre",
  "s",
  "small",
  "source",
  "span",
  "strong",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
  "video",
]);

const TAG = /<\/?([A-Za-z][A-Za-z0-9-]*)(?:\s[^<>]*)?\/?>/g;

function isArticleHtmlTag(name: string) {
  return ARTICLE_HTML_TAGS.has(name);
}

function escapeTextTags(html: string): string {
  return html.replace(TAG, (tag, name: string) =>
    isArticleHtmlTag(name)
      ? tag
      : tag.replaceAll("<", "&lt;").replaceAll(">", "&gt;"),
  );
}

export const remarkArticleHtml: Plugin<[], Root> = () => (tree) => {
  visit(tree, "html", (node: Html) => {
    node.value = escapeTextTags(node.value);
  });
};

function collectTextTagNames(markdown: string, names: Set<string>) {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  visit(tree, "html", (node: Html) => {
    for (const [, name] of node.value.matchAll(TAG)) {
      if (!isArticleHtmlTag(name)) names.add(name);
    }
  });
}

function collectFromSegments(segments: ToggleNode[], names: Set<string>) {
  for (const segment of segments) {
    if (segment.type === "toggle") {
      collectFromSegments(segment.children, names);
    } else {
      collectTextTagNames(segment.content, names);
    }
  }
}

export function tagNamesShownAsText(content: string): string[] {
  const names = new Set<string>();
  collectFromSegments(parseToggleSegments(content), names);
  return [...names];
}
