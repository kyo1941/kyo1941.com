import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  PortfolioFormValues,
  PortfolioUpsertInput,
} from "@/app/types/portfolio";
import { adminPortfolioRepository } from "@/app/repository/adminPortfolioRepository";
import {
  getTodayInputDate,
  toJaLongDateFromInput,
} from "@/app/hooks/admin/adminDate";
import { useUnsavedEditRestore } from "@/app/hooks/admin/useUnsavedEditRestore";

export function useAdminPortfolioCreate() {
  const [initialValues] = useState<PortfolioFormValues>(() => ({
    title: "",
    description: "",
    content: "",
    coverImage: "",
    date: getTodayInputDate(),
    isDraft: false,
  }));

  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description);
  const [content, setContent] = useState(initialValues.content);
  const [coverImage, setCoverImage] = useState(initialValues.coverImage);
  const [date, setDate] = useState(initialValues.date);
  const [isDraft, setIsDraft] = useState(initialValues.isDraft);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const formValues = useMemo<PortfolioFormValues>(
    () => ({ title, description, content, coverImage, date, isDraft }),
    [title, description, content, coverImage, date, isDraft],
  );

  const applyFormValues = useCallback((values: PortfolioFormValues) => {
    setTitle(values.title);
    setDescription(values.description);
    setContent(values.content);
    setCoverImage(values.coverImage);
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
    docKey: "portfolio:new",
    formValues,
    applyFormValues,
    hasServerCopy: false,
  });

  useEffect(() => {
    loadBaseValues(initialValues);
  }, [loadBaseValues, initialValues]);

  const submitCreate = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const payload: PortfolioUpsertInput = {
      title,
      description,
      content,
      coverImage,
      date: toJaLongDateFromInput(date),
      isDraft,
    };

    try {
      await adminPortfolioRepository.create(payload);
      discardBackup();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create portfolio");
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [title, description, content, coverImage, date, isDraft, discardBackup]);

  return {
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
    state: { isLoading, error, restoreMessage, backupFailed },
    actions: { submitCreate, discardUnsavedEdit },
  };
}
