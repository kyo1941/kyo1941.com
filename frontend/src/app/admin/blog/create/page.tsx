"use client";

import { usePathname, useRouter } from "next/navigation";
import { UnauthorizedError } from "@/app/types/errors";
import { useAdminBlogCreate } from "@/app/hooks/admin/useAdminBlogCreate";
import { useAdminTags } from "@/app/hooks/admin/useAdminTags";
import { AdminDocForm } from "@/app/admin/components/AdminDocForm";

export default function CreateBlogPage() {
  const router = useRouter();
  const pathname = usePathname();

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
    state: { isLoading, restoreMessage, backupFailed },
    actions: { submitCreate, discardRestoredEdit },
  } = useAdminBlogCreate();

  const {
    state: { tags: availableTags },
  } = useAdminTags({ onUnauthorized: () => router.push("/admin/login") });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await submitCreate();
      router.push("/admin");
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        router.push(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
      } else {
        alert("Failed to create blog");
      }
      console.error("Failed to create blog", error);
    }
  };

  return (
    <AdminDocForm
      heading="ブログ新規作成"
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
      publishLabel="ブログを投稿する"
      restoreMessage={restoreMessage}
      onDiscardRestoredEdit={discardRestoredEdit}
      backupFailed={backupFailed}
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
