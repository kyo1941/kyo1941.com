import { useCallback, useEffect, useMemo, useState } from "react";
import type { BlogFormValues, BlogUpsertInput } from "@/app/types/blog";
import { adminBlogRepository } from "@/app/repository/adminBlogRepository";
import {
  getTodayInputDate,
  toJaLongDateFromInput,
} from "@/app/hooks/admin/adminDate";
import { useUnsavedEditRestore } from "@/app/hooks/admin/useUnsavedEditRestore";

export function useAdminBlogCreate() {
  const [initialValues] = useState<BlogFormValues>(() => ({
    title: "",
    description: "",
    content: "",
    tags: [],
    date: getTodayInputDate(),
    isDraft: false,
  }));

  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description);
  const [content, setContent] = useState(initialValues.content);
  const [tags, setTags] = useState(initialValues.tags);
  const [date, setDate] = useState(initialValues.date);
  const [isDraft, setIsDraft] = useState(initialValues.isDraft);

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
    backupFailed,
    loadBaseValues,
    discardUnsavedEdit,
    discardBackup,
  } = useUnsavedEditRestore({
    docKey: "blog:new",
    formValues,
    applyFormValues,
    hasServerCopy: false,
  });

  useEffect(() => {
    loadBaseValues(initialValues);
  }, [loadBaseValues, initialValues]);

  const toggleTag = useCallback((tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const submitCreate = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const payload: BlogUpsertInput = {
      title,
      description,
      content,
      tags,
      date: toJaLongDateFromInput(date),
      isDraft,
    };

    try {
      await adminBlogRepository.create(payload);
      discardBackup();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create blog");
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [title, description, content, tags, date, isDraft, discardBackup]);

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
    state: { isLoading, error, restoreMessage, backupFailed },
    actions: { submitCreate, discardUnsavedEdit },
  };
}
