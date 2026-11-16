import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Heading } from "mdast";

type Options = {
  idsByOffset: Record<number, string>;
};

export const remarkHeadingIds: Plugin<[Options], Root> =
  ({ idsByOffset }) =>
  (tree) => {
    visit(tree, "heading", (node: Heading) => {
      const offset = node.position?.start.offset;
      const id = offset === undefined ? undefined : idsByOffset[offset];
      if (id === undefined) return;
      node.data = node.data ?? {};
      node.data.hProperties = { ...node.data.hProperties, id };
    });
  };
