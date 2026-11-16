import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Element } from "hast";

type Options = {
  ids: string[];
};

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4"]);

export const rehypeHeadingIds: Plugin<[Options], Root> =
  ({ ids }) =>
  (tree) => {
    let next = 0;
    visit(tree, "element", (node: Element) => {
      if (!HEADING_TAGS.has(node.tagName)) return;
      const id = ids[next++];
      if (id !== undefined) node.properties.id = id;
    });
  };
