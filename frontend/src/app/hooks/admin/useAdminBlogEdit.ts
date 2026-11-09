import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Blog, BlogFormValues, BlogUpsertInput } from "@/app/types/blog";
import { adminBlogRepository } from "@/app/repository/adminBlogRepository";
import { UnauthorizedError } from "@/app/types/errors";
import {
  toInputDateStringFromJaDate,
  toJaLongDateFromInput,
} from "@/app/hooks/admin/adminDate";
import { useUnsavedEditRestore } from "@/app/hooks/admin/useUnsavedEditRestore";

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

  const formValues = useMemo<BlogFormValues>(
    () => ({ title, description, content, tags, date, isDraft }),
    [title, description, content, tags, date, isDraft],
  );

  const applyFormValues = useCallback((values: BlogFormValues) => {
    setTitle(values.title);
    setDescription(values.description);
    setContent(values.content);
    setTags(values.tags);
    setDate(values.date);
    setIsDraft(values.isDraft);
  }, []);

  const {
    restoreMessage,
    restoredChanges,
    backupFailed,
    hasConflictingEdit,
    conflictingChanges,
    loadBaseValues,
    restoreConflictingEdit,
    discardUnsavedEdit,
    discardBackup,
  } = useUnsavedEditRestore({
    docKey: originalSlug ? `blog:${originalSlug}` : undefined,
    formValues,
    applyFormValues,
    hasServerCopy: true,
  });

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
        loadBaseValues(toFormValues(data));
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
  }, [originalSlug, loadBaseValues]);

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
      discardBackup();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update blog");
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [originalSlug, buildPayload, discardBackup]);

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
      restoredChanges,
      backupFailed,
      hasConflictingEdit,
      conflictingChanges,
    },
    actions: { submitUpdate, restoreConflictingEdit, discardUnsavedEdit },
  };
}
