import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Blog, BlogUpsertInput } from "@/app/types/blog";
import { adminBlogRepository } from "@/app/repository/adminBlogRepository";
import { UnauthorizedError } from "@/app/types/errors";
import {
  toInputDateStringFromJaDate,
  toJaLongDateFromInput,
} from "@/app/hooks/admin/adminDate";
import { useUnsavedEditBackup } from "@/app/hooks/admin/useUnsavedEditBackup";
import { isSameEdit, readUnsavedEdit } from "@/app/utils/adminUnsavedEdit";

const RESTORE_MESSAGE = "未保存の入力内容を復元しました";

type BlogFormValues = {
  title: string;
  description: string;
  content: string;
  tags: string[];
  date: string;
  isDraft: boolean;
};

function toFormValues(data: Blog): BlogFormValues {
  return {
    title: data.title,
    description: data.description,
    content: data.content,
    tags: data.tags || [],
    date: toInputDateStringFromJaDate(data.date),
    isDraft: data.isDraft ?? false,
  };
}

export function useAdminBlogEdit(
  originalSlug: string | undefined,
  { onUnauthorized }: { onUnauthorized?: () => void } = {},
) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [isDraft, setIsDraft] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [restoreMessage, setRestoreMessage] = useState("");
  const [serverValues, setServerValues] = useState<BlogFormValues | null>(null);
  const [conflictingValues, setConflictingValues] =
    useState<BlogFormValues | null>(null);

  const formValues = useMemo<BlogFormValues>(
    () => ({ title, description, content, tags, date, isDraft }),
    [title, description, content, tags, date, isDraft],
  );

  const { backupFailed, beginBackup, markSaved, discardBackup } =
    useUnsavedEditBackup(
      originalSlug ? `blog:${originalSlug}` : undefined,
      formValues,
    );

  const applyFormValues = useCallback((values: BlogFormValues) => {
    setTitle(values.title);
    setDescription(values.description);
    setContent(values.content);
    setTags(values.tags);
    setDate(values.date);
    setIsDraft(values.isDraft);
  }, []);

  const applyUnsavedEdit = useCallback(
    (unsavedValues: BlogFormValues, server: BlogFormValues) => {
      applyFormValues(unsavedValues);
      setRestoreMessage(RESTORE_MESSAGE);
      beginBackup(server, unsavedValues);
    },
    [applyFormValues, beginBackup],
  );

  const onUnauthorizedRef = useRef(onUnauthorized);
  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  useEffect(() => {
    if (!originalSlug) return;

    let cancelled = false;

    const fetchBlog = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data: Blog = await adminBlogRepository.get(originalSlug);
        if (cancelled) return;

        const server = toFormValues(data);
        setServerValues(server);

        const unsaved = readUnsavedEdit<BlogFormValues>(`blog:${originalSlug}`);
        if (!unsaved) {
          applyFormValues(server);
          beginBackup(server);
        } else if (isSameEdit(unsaved.base, server)) {
          applyUnsavedEdit(unsaved.values, server);
        } else {
          applyFormValues(server);
          setConflictingValues(unsaved.values);
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof UnauthorizedError) {
          onUnauthorizedRef.current?.();
          return;
        }
        setError(e instanceof Error ? e.message : "Failed to fetch blog");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchBlog();
    return () => {
      cancelled = true;
    };
  }, [originalSlug, applyFormValues, applyUnsavedEdit, beginBackup]);

  const restoreConflictingEdit = useCallback(() => {
    if (!conflictingValues || !serverValues) return;
    applyUnsavedEdit(conflictingValues, serverValues);
    setConflictingValues(null);
  }, [applyUnsavedEdit, conflictingValues, serverValues]);

  const discardUnsavedEdit = useCallback(() => {
    if (!serverValues) return;
    discardBackup();
    applyFormValues(serverValues);
    setRestoreMessage("");
    setConflictingValues(null);
    beginBackup(serverValues);
  }, [applyFormValues, beginBackup, discardBackup, serverValues]);

  const toggleTag = useCallback((tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const buildPayload = useCallback((): BlogUpsertInput => {
    return {
      title,
      description,
      content,
      tags,
      date: toJaLongDateFromInput(date),
      isDraft,
    };
  }, [title, description, content, tags, date, isDraft]);

  const submitUpdate = useCallback(async () => {
    if (!originalSlug) {
      throw new Error("Missing slug");
    }
    setIsLoading(true);
    setError("");
    try {
      await adminBlogRepository.update(originalSlug, buildPayload());
      markSaved(formValues);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update blog");
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [originalSlug, buildPayload, markSaved, formValues]);

  return {
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
    state: {
      isLoading,
      error,
      restoreMessage,
      backupFailed,
      hasConflictingEdit: conflictingValues !== null,
    },
    actions: { submitUpdate, restoreConflictingEdit, discardUnsavedEdit },
  };
}
