import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import type { Root, Html } from "mdast";

// 記事は Markdown で書くので、HTML として扱うのは Markdown で表せないものに使うタグだけにする。
// 型引数の Flow<T> のようにタグの形をしているだけの文字列が消えないよう、それ以外はすべて文字として表示する。
const TAGS_RENDERED_AS_HTML = new Set([
  "br",
  "img",
  "sup",
  "sub",
  "kbd",
  "mark",
  "u",
  "iframe",
  "video",
  "source",
]);

const TAG =
  /<\/?([A-Za-z][A-Za-z0-9-]*)(?:\s(?:[^<>"']|"[^"]*"|'[^']*')*)?\/?>/g;

function showOtherTagsAsText(html: string): string {
  return html.replace(TAG, (tag, name: string) =>
    TAGS_RENDERED_AS_HTML.has(name)
      ? tag
      : tag.replaceAll("<", "&lt;").replaceAll(">", "&gt;"),
  );
}

export const remarkArticleHtml: Plugin<[], Root> = () => (tree) => {
  visit(tree, "html", (node: Html) => {
    node.value = showOtherTagsAsText(node.value);
  });
};
