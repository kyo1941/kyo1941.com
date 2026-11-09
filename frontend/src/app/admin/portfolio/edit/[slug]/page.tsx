"use client";

import { usePathname, useRouter, useParams } from "next/navigation";
import { UnauthorizedError } from "@/app/types/errors";
import { useAdminPortfolioEdit } from "@/app/hooks/admin/useAdminPortfolioEdit";
import { AdminDocForm } from "@/app/admin/components/AdminDocForm";

export default function EditPortfolioPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const originalSlug = params.slug as string;

  const redirectToLogin = () =>
    router.push(`/admin/login?redirect=${encodeURIComponent(pathname)}`);

  const {
    form: {
      title,
      setTitle,
      description,
      setDescription,
      content,
      setContent,
      coverImage,
      setCoverImage,
      date,
      setDate,
      isDraft,
      setIsDraft,
    },
    state: {
      isLoading,
      restoreMessage,
      restoredChanges,
      backupFailed,
      hasConflictingEdit,
      conflictingChanges,
    },
    actions: { submitUpdate, restoreConflictingEdit, discardUnsavedEdit },
  } = useAdminPortfolioEdit(originalSlug, { onUnauthorized: redirectToLogin });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await submitUpdate();
      router.push("/admin");
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        redirectToLogin();
      } else {
        alert("Failed to update portfolio");
      }
      console.error("Failed to update portfolio", error);
    }
  };

  return (
    <AdminDocForm
      heading="ポートフォリオ編集"
      title={title}
      setTitle={setTitle}
      date={date}
      setDate={setDate}
      description={description}
      setDescription={setDescription}
      content={content}
      setContent={setContent}
      isDraft={isDraft}
      setIsDraft={setIsDraft}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      publishLabel="ポートフォリオを更新する"
      restoreMessage={restoreMessage}
      restoredChanges={restoredChanges}
      onDiscardRestoredEdit={discardUnsavedEdit}
      backupFailed={backupFailed}
      conflictingEdit={
        hasConflictingEdit
          ? {
              changes: conflictingChanges,
              onRestore: restoreConflictingEdit,
              onDiscard: discardUnsavedEdit,
            }
          : undefined
      }
      extraFields={
        <div className="mb-4">
          <label className="mb-2 block text-sm font-bold text-gray-700">
            画像URL
          </label>
          <input
            className="w-full rounded border px-3 py-2 shadow focus:outline-none"
            type="text"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
          />
        </div>
      }
    />
  );
}
