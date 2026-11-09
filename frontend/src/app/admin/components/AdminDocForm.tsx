"use client";

import type { ReactNode } from "react";
import { useRef, useLayoutEffect } from "react";
import { AdminMarkdownPreview } from "./AdminMarkdownPreview";
import { useCommittedPreview } from "@/app/hooks/admin/useCommittedPreview";
import { useMarkdownListEditor } from "@/app/hooks/admin/useMarkdownListEditor";

type AdminDocFormProps = {
  heading: string;
  title: string;
  setTitle: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  isDraft: boolean;
  setIsDraft: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  publishLabel: string;
  restoreMessage?: string;
  onDiscardRestoredEdit?: () => void;
  backupFailed?: boolean;
  conflictingEdit?: { onRestore: () => void; onDiscard: () => void };
  extraFields?: ReactNode;
};

export function AdminDocForm({
  heading,
  title,
  setTitle,
  date,
  setDate,
  description,
  setDescription,
  content,
  setContent,
  isDraft,
  setIsDraft,
  onSubmit,
  isLoading,
  publishLabel,
  restoreMessage,
  onDiscardRestoredEdit,
  backupFailed,
  conflictingEdit,
  extraFields,
}: AdminDocFormProps) {
  const { previewContent, onCompositionStart, onCompositionEnd } =
    useCommittedPreview(content);
  const { onKeyDown } = useMarkdownListEditor(setContent);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const isResolvingConflict = conflictingEdit !== undefined;

  // 確認画面のあいだは本文欄がなく高さを測れないので、確認画面を閉じたときにも測り直す。
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    // 高さを測り直すために一瞬縮めるとページが短くなり、ブラウザがスクロール位置を切り詰めてしまう。
    // そのままだと入力のたびにカーソル行が画面下端へ寄るので、測る前の位置に戻す。
    const scrollY = window.scrollY;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    window.scrollTo(0, scrollY);
  }, [content, isResolvingConflict]);

  const buttonLabel = isDraft ? "下書きを保存する" : publishLabel;

  if (conflictingEdit) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="mb-6 text-3xl font-bold">{heading}</h1>
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          <p className="mb-3">
            未保存の入力内容がありますが、その後サーバー側の内容が更新されています。
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded border border-current px-3 py-1 font-bold"
              onClick={conflictingEdit.onRestore}
            >
              入力内容を復元する
            </button>
            <button
              type="button"
              className="rounded border border-current px-3 py-1"
              onClick={conflictingEdit.onDiscard}
            >
              破棄してサーバーの内容を使う
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-6 text-3xl font-bold">{heading}</h1>
      {restoreMessage && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/60 dark:text-green-300">
          <p>{restoreMessage}</p>
          {onDiscardRestoredEdit && (
            <button
              type="button"
              className="rounded border border-current px-3 py-1"
              onClick={onDiscardRestoredEdit}
            >
              破棄する
            </button>
          )}
        </div>
      )}
      {backupFailed && (
        <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300">
          入力内容をブラウザに保存できませんでした。保存するまでページを閉じないでください。
        </p>
      )}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form onSubmit={onSubmit}>
          {/* 保存の応答待ち中に入力できると、保存されない入力が残るので、そのあいだは入力させない。 */}
          <fieldset disabled={isLoading} className="disabled:opacity-60">
            <div className="mb-4">
              <label className="mb-2 block text-sm font-bold text-gray-700">
                タイトル
              </label>
              <input
                className="w-full rounded border px-3 py-2 shadow focus:outline-none"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-bold text-gray-700">
                日付
              </label>
              <input
                className="w-full rounded border px-3 py-2 shadow focus:outline-none"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-bold text-gray-700">
                説明文
              </label>
              <textarea
                className="w-full rounded border px-3 py-2 shadow focus:outline-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            {extraFields}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-bold text-gray-700">
                内容
              </label>
              <textarea
                ref={contentRef}
                className="min-h-64 w-full overflow-hidden rounded border px-3 py-2 shadow focus:outline-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onCompositionStart={onCompositionStart}
                onCompositionEnd={(e) =>
                  onCompositionEnd(e.currentTarget.value)
                }
                onKeyDown={onKeyDown}
                required
              />
            </div>
            <div className="mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDraft}
                  onChange={(e) => setIsDraft(e.target.checked)}
                />
                <span className="text-sm font-bold text-gray-700">
                  下書きとして保存
                </span>
              </label>
            </div>
            <button
              className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              type="submit"
              disabled={isLoading}
            >
              {buttonLabel}
            </button>
          </fieldset>
        </form>
        <AdminMarkdownPreview content={previewContent} />
      </div>
    </div>
  );
}
