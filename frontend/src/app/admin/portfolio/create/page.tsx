"use client";

import { usePathname, useRouter } from "next/navigation";
import { UnauthorizedError } from "@/app/types/errors";
import { useAdminPortfolioCreate } from "@/app/hooks/admin/useAdminPortfolioCreate";
import { AdminDocForm } from "@/app/admin/components/AdminDocForm";

export default function CreatePortfolioPage() {
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
      coverImage,
      setCoverImage,
      date,
      setDate,
      isDraft,
      setIsDraft,
    },
    state: { isLoading, restoreMessage, restoredChanges, backupFailed },
    actions: { submitCreate, discardUnsavedEdit },
  } = useAdminPortfolioCreate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await submitCreate();
      router.push("/admin");
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        router.push(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
      } else {
        alert("Failed to create portfolio");
      }
      console.error("Failed to create portfolio", error);
    }
  };

  return (
    <AdminDocForm
      heading="ポートフォリオ新規作成"
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
      publishLabel="ポートフォリオを投稿する"
      restoreMessage={restoreMessage}
      restoredChanges={restoredChanges}
      onDiscardRestoredEdit={discardUnsavedEdit}
      backupFailed={backupFailed}
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
