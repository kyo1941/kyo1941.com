"use client";

import { usePathname, useRouter, useParams } from "next/navigation";
import { UnauthorizedError } from "@/app/types/errors";
import { useAdminBlogEdit } from "@/app/hooks/admin/useAdminBlogEdit";
import { useAdminTags } from "@/app/hooks/admin/useAdminTags";
import { AdminDocForm } from "@/app/admin/components/AdminDocForm";

export default function EditBlogPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const originalSlug = params.slug as string;

  const handleUnauthorized = () => router.push("/admin/login");

  const {
    form: {
      title,
      setTitle,
      description,
      setDescription,
      content,
      setContent,
      tags,
      toggleTag,
      date,
      setDate,
      isDraft,
      setIsDraft,
    },
    state: { isLoading, restoreMessage, backupFailed, hasConflictingEdit },
    actions: { submitUpdate, restoreConflictingEdit, discardUnsavedEdit },
  } = useAdminBlogEdit(originalSlug, { onUnauthorized: handleUnauthorized });

  const {
    state: { tags: availableTags },
  } = useAdminTags({ onUnauthorized: handleUnauthorized });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await submitUpdate();
      router.push("/admin");
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        router.push(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
      } else {
        alert("Failed to update blog");
      }
      console.error("Failed to update blog", error);
    }
  };

  return (
    <AdminDocForm
      heading="Edit Blog"
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
      publishLabel="ブログを更新する"
      restoreMessage={restoreMessage}
      onDiscardRestoredEdit={discardUnsavedEdit}
      backupFailed={backupFailed}
      conflictingEdit={
        hasConflictingEdit
          ? { onRestore: restoreConflictingEdit, onDiscard: discardUnsavedEdit }
          : undefined
      }
      extraFields={
        <div className="mb-4">
          <label className="mb-2 block text-sm font-bold text-gray-700">
            タグ
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <label
                key={tag.id}
                className="flex items-center gap-1 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={tags.includes(tag.name)}
                  onChange={() => toggleTag(tag.name)}
                />
                <span>{tag.name}</span>
              </label>
            ))}
          </div>
        </div>
      }
    />
  );
}
