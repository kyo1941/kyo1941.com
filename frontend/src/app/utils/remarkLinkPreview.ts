import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Paragraph, Link, Text } from "mdast";
import type { OgpData } from "@/app/types/ogp";

type Options = {
  ogpData: Record<string, OgpData>;
};

// rehype-raw が HTML として組み立て直すときに属性値は文字列にされるため、OGP の項目ごとに文字列の属性へ分けて渡す
const OGP_ATTRIBUTES = {
  url: "data-ogp-url",
  title: "data-ogp-title",
  description: "data-ogp-description",
  image: "data-ogp-image",
  siteName: "data-ogp-site-name",
  favicon: "data-ogp-favicon",
} as const satisfies Record<keyof OgpData, string>;

export const remarkLinkPreview: Plugin<[Options], Root> =
  ({ ogpData }) =>
  (tree) => {
    visit(tree, "paragraph", (node: Paragraph) => {
      if (node.children.length !== 1) return;
      const child = node.children[0];
      if (child.type !== "link") return;

      const link = child as Link;
      if (link.children.length !== 1) return;
      const linkText = link.children[0] as Text;
      if (linkText.type !== "text") return;
      if (linkText.value !== link.url) return;

      const ogp = ogpData[link.url];
      if (!ogp) return;

      node.data = node.data ?? {};
      node.data.hProperties = {
        ...node.data.hProperties,
        ...ogpAttributes(ogp),
      };
    });
  };

function ogpAttributes(ogp: OgpData): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const [field, attribute] of Object.entries(OGP_ATTRIBUTES)) {
    const value = ogp[field as keyof OgpData];
    if (value !== undefined) attributes[attribute] = value;
  }
  return attributes;
}

export function linkPreviewOgp(
  attributes: Record<string, unknown>,
): OgpData | undefined {
  const url = attributes[OGP_ATTRIBUTES.url];
  if (typeof url !== "string") return undefined;
  const text = (attribute: string) => {
    const value = attributes[attribute];
    return typeof value === "string" ? value : undefined;
  };
  return {
    url,
    title: text(OGP_ATTRIBUTES.title),
    description: text(OGP_ATTRIBUTES.description),
    image: text(OGP_ATTRIBUTES.image),
    siteName: text(OGP_ATTRIBUTES.siteName),
    favicon: text(OGP_ATTRIBUTES.favicon),
  };
}
