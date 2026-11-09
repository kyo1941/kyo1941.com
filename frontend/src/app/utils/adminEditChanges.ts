import { structuredPatch } from "diff";

export type DiffLine = {
  type: "added" | "removed" | "context";
  text: string;
};

export type EditChange =
  | { kind: "value"; label: string; before: string; after: string }
  | { kind: "tags"; label: string; added: string[]; removed: string[] }
  | {
      kind: "lines";
      label: string;
      added: number;
      removed: number;
      hunks: DiffLine[][];
    };

type EditableFields = {
  title?: string;
  date?: string;
  description?: string;
  coverImage?: string;
  tags?: string[];
  isDraft?: boolean;
  content?: string;
};

const DIFF_CONTEXT_LINES = 2;

const DIFF_LINE_TYPES = {
  "+": "added",
  "-": "removed",
  " ": "context",
} as const;

function diffValue(
  label: string,
  before: string | undefined,
  after: string | undefined,
): EditChange[] {
  if (before === after) return [];
  return [{ kind: "value", label, before: before ?? "", after: after ?? "" }];
}

function diffTags(before: string[] = [], after: string[] = []): EditChange[] {
  const added = after.filter((tag) => !before.includes(tag));
  const removed = before.filter((tag) => !after.includes(tag));
  if (added.length === 0 && removed.length === 0) return [];
  return [{ kind: "tags", label: "タグ", added, removed }];
}

const withTrailingNewline = (text: string) =>
  text.endsWith("\n") ? text : `${text}\n`;

function diffLines(label: string, before = "", after = ""): EditChange[] {
  // 末尾に行を足しただけでも、改行のない最終行が書き換えられた扱いになるので、末尾をそろえて比べる。
  const hunks = structuredPatch(
    "",
    "",
    withTrailingNewline(before),
    withTrailingNewline(after),
    "",
    "",
    { context: DIFF_CONTEXT_LINES },
  ).hunks.map((hunk) =>
    hunk.lines
      .filter((line) => line[0] in DIFF_LINE_TYPES)
      .map((line) => ({
        type: DIFF_LINE_TYPES[line[0] as keyof typeof DIFF_LINE_TYPES],
        text: line.slice(1),
      })),
  );
  if (hunks.length === 0) return [];
  const lines = hunks.flat();

  return [
    {
      kind: "lines",
      label,
      added: lines.filter((line) => line.type === "added").length,
      removed: lines.filter((line) => line.type === "removed").length,
      hunks,
    },
  ];
}

const toPublicationLabel = (isDraft: boolean | undefined) =>
  isDraft === undefined ? undefined : isDraft ? "下書き" : "公開";

export function listEditChanges(
  before: EditableFields,
  after: EditableFields,
): EditChange[] {
  return [
    ...diffValue("タイトル", before.title, after.title),
    ...diffValue("日付", before.date, after.date),
    ...diffValue(
      "公開状態",
      toPublicationLabel(before.isDraft),
      toPublicationLabel(after.isDraft),
    ),
    ...diffTags(before.tags, after.tags),
    ...diffValue("画像URL", before.coverImage, after.coverImage),
    ...diffLines("説明文", before.description, after.description),
    ...diffLines("本文", before.content, after.content),
  ];
}
