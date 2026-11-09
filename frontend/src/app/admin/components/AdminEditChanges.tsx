"use client";

import type { DiffLine, EditChange } from "@/app/utils/adminEditChanges";

const DIFF_LINE_STYLES: Record<DiffLine["type"], string> = {
  added: "bg-green-100 text-green-900 dark:bg-green-950/70 dark:text-green-200",
  removed: "bg-red-100 text-red-900 dark:bg-red-950/70 dark:text-red-200",
  context: "text-gray-500",
};

const DIFF_LINE_MARKS: Record<DiffLine["type"], string> = {
  added: "+",
  removed: "-",
  context: " ",
};

function summarize(change: EditChange) {
  if (change.kind !== "lines") return change.label;
  const counts = [
    change.added > 0 && `+${change.added}行`,
    change.removed > 0 && `−${change.removed}行`,
  ].filter(Boolean);
  return `${change.label}（${counts.join(" ")}）`;
}

function ValueChange({ before, after }: { before: string; after: string }) {
  return (
    <p className="break-all">
      <span className="text-red-700 line-through dark:text-red-300">
        {before || "（空）"}
      </span>
      {" → "}
      <span className="text-green-700 dark:text-green-300">
        {after || "（空）"}
      </span>
    </p>
  );
}

function TagsChange({
  added,
  removed,
}: {
  added: string[];
  removed: string[];
}) {
  return (
    <p className="flex flex-wrap gap-2">
      {added.map((tag) => (
        <span key={`+${tag}`} className="text-green-700 dark:text-green-300">
          +{tag}
        </span>
      ))}
      {removed.map((tag) => (
        <span key={`-${tag}`} className="text-red-700 dark:text-red-300">
          −{tag}
        </span>
      ))}
    </p>
  );
}

function LinesChange({ hunks }: { hunks: DiffLine[][] }) {
  return (
    <div className="max-h-80 overflow-auto rounded border border-gray-200 bg-surface font-mono text-xs">
      {hunks.map((hunk, hunkIndex) => (
        <div
          key={hunkIndex}
          className="border-gray-200 py-1 not-first:border-t"
        >
          {hunk.map((line, lineIndex) => (
            <pre
              key={lineIndex}
              className={`whitespace-pre-wrap break-all px-2 ${DIFF_LINE_STYLES[line.type]}`}
            >
              {DIFF_LINE_MARKS[line.type]} {line.text}
            </pre>
          ))}
        </div>
      ))}
    </div>
  );
}

export function AdminEditChanges({
  changes,
  heading,
}: {
  changes: EditChange[];
  heading: string;
}) {
  if (changes.length === 0) return null;

  return (
    <details className="mt-2">
      <summary className="cursor-pointer">
        {heading}: {changes.map(summarize).join(" / ")}
      </summary>
      <dl className="mt-2 space-y-3 text-gray-800">
        {changes.map((change) => (
          <div key={change.label}>
            <dt className="mb-1 font-bold">{change.label}</dt>
            <dd>
              {change.kind === "value" && (
                <ValueChange before={change.before} after={change.after} />
              )}
              {change.kind === "tags" && (
                <TagsChange added={change.added} removed={change.removed} />
              )}
              {change.kind === "lines" && <LinesChange hunks={change.hunks} />}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
