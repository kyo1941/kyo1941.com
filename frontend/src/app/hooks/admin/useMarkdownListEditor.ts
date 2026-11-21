"use client";

import { useCallback, useRef } from "react";

function isInsideCodeBlock(value: string, cursor: number): boolean {
  const lines = value.slice(0, cursor).split("\n");
  let fenceCount = 0;
  for (const line of lines) {
    if (line.startsWith("```")) fenceCount++;
  }
  return fenceCount % 2 === 1;
}

export function useMarkdownListEditor(setContent: (value: string) => void) {
  const pendingCursorRef = useRef<number | null>(null);

  const applyEdit = useCallback(
    (textarea: HTMLTextAreaElement, newValue: string, newCursor: number) => {
      pendingCursorRef.current = newCursor;
      setContent(newValue);
      requestAnimationFrame(() => {
        const pos = pendingCursorRef.current;
        if (pos !== null) {
          textarea.setSelectionRange(pos, pos);
          pendingCursorRef.current = null;
        }
      });
    },
    [setContent],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.nativeEvent.isComposing) return;

      const textarea = e.currentTarget;
      const { value, selectionStart, selectionEnd } = textarea;

      if (selectionStart !== selectionEnd) return;

      const cursor = selectionStart;
      const lineStart = value.lastIndexOf("\n", cursor - 1) + 1;
      const lineEndRaw = value.indexOf("\n", cursor);
      const lineEnd = lineEndRaw === -1 ? value.length : lineEndRaw;
      const currentLine = value.slice(lineStart, lineEnd);

      if (e.key === "Enter") {
        const listMatch = currentLine.match(/^(\s*)- (.*)/);
        if (!listMatch) return;

        e.preventDefault();

        const [, indent, itemContent] = listMatch;

        if (itemContent !== "") {
          const insertion = `\n${indent}- `;
          const newValue =
            value.slice(0, cursor) + insertion + value.slice(cursor);
          applyEdit(textarea, newValue, cursor + insertion.length);
        } else if (indent.length >= 2) {
          const newLine = `${indent.slice(2)}- `;
          const newValue =
            value.slice(0, lineStart) + newLine + value.slice(lineEnd);
          applyEdit(textarea, newValue, lineStart + newLine.length);
        } else {
          const newValue = value.slice(0, lineStart) + value.slice(lineEnd);
          applyEdit(textarea, newValue, Math.min(lineStart, newValue.length));
        }
        return;
      }

      if (e.key === "Tab") {
        const isListLine = /^\s*- /.test(currentLine);
        const inCodeBlock = isInsideCodeBlock(value, cursor);

        if (!isListLine && !inCodeBlock) return;

        e.preventDefault();
        if (e.shiftKey) {
          if (!currentLine.startsWith("  ")) return;
          const newValue =
            value.slice(0, lineStart) +
            currentLine.slice(2) +
            value.slice(lineEnd);
          applyEdit(
            textarea,
            newValue,
            lineStart + Math.max(0, cursor - lineStart - 2),
          );
        } else if (inCodeBlock) {
          const newValue = value.slice(0, cursor) + "  " + value.slice(cursor);
          applyEdit(textarea, newValue, cursor + 2);
        } else {
          const newValue =
            value.slice(0, lineStart) +
            "  " +
            currentLine +
            value.slice(lineEnd);
          applyEdit(textarea, newValue, cursor + 2);
        }
      }
    },
    [applyEdit],
  );

  return { onKeyDown };
}
