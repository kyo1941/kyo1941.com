import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Element } from "hast";

type Options = {
  firstLine: number;
};

export const SOURCE_LINE_ATTRIBUTE = "data-source-line";

export const rehypeSourceLine: Plugin<[Options], Root> =
  ({ firstLine }) =>
  (tree) => {
    visit(tree, "element", (node: Element) => {
      const line = node.position?.start.line;
      if (line === undefined) return;
      node.properties[SOURCE_LINE_ATTRIBUTE] = firstLine + line - 1;
    });
  };

export function sourceLineOf(
  attributes: Record<string, unknown>,
): number | undefined {
  const line = Number(attributes[SOURCE_LINE_ATTRIBUTE]);
  return Number.isInteger(line) ? line : undefined;
}
