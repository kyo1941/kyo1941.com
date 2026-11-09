import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Portfolio,
  PortfolioFormValues,
  PortfolioUpsertInput,
} from "@/app/types/portfolio";
import { adminPortfolioRepository } from "@/app/repository/adminPortfolioRepository";
import { UnauthorizedError } from "@/app/types/errors";
import {
  toInputDateStringFromJaDate,
  toJaLongDateFromInput,
} from "@/app/hooks/admin/adminDate";
import { useUnsavedEditRestore } from "@/app/hooks/admin/useUnsavedEditRestore";

function toFormValues(data: Portfolio): PortfolioFormValues {
  return {
    title: data.title,
    description: data.description,
    content: data.content,
    coverImage: data.coverImage || "",
    date: toInputDateStringFromJaDate(data.date),
    isDraft: data.isDraft ?? false,
  };
}

export function useAdminPortfolioEdit(
  originalSlug: string | undefined,
  { onUnauthorized }: { onUnauthorized?: () => void } = {},
) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [date, setDate] = useState("");
  const [isDraft, setIsDraft] = useState(false);

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
    hasConflictingEdit,
    loadBaseValues,
    restoreConflictingEdit,
    discardUnsavedEdit,
    markSaved,
  } = useUnsavedEditRestore({
    docKey: originalSlug ? `portfolio:${originalSlug}` : undefined,
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
    const fetchPortfolio = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data: Portfolio =
          await adminPortfolioRepository.get(originalSlug);
        if (cancelled) return;
        loadBaseValues(toFormValues(data));
      } catch (e) {
        if (cancelled) return;
        if (e instanceof UnauthorizedError) {
          onUnauthorizedRef.current?.();
          return;
        }
        setError(e instanceof Error ? e.message : "Failed to fetch portfolio");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchPortfolio();
    return () => {
      cancelled = true;
    };
  }, [originalSlug, loadBaseValues]);

  const buildPayload = useCallback((): PortfolioUpsertInput => {
    return {
      title,
      description,
      content,
      coverImage,
      date: toJaLongDateFromInput(date),
      isDraft,
    };
  }, [title, description, content, coverImage, date, isDraft]);

  const submitUpdate = useCallback(async () => {
    if (!originalSlug) {
      throw new Error("Missing slug");
    }
    setIsLoading(true);
    setError("");
    try {
      await adminPortfolioRepository.update(originalSlug, buildPayload());
      markSaved(formValues);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update portfolio");
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
      coverImage,
      setCoverImage,
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
      hasConflictingEdit,
    },
    actions: { submitUpdate, restoreConflictingEdit, discardUnsavedEdit },
  };
}
