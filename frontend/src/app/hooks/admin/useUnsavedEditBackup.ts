import { useCallback, useEffect, useRef, useState } from "react";
import {
  isSameEdit,
  removeExpiredUnsavedEdits,
  removeUnsavedEdit,
  writeUnsavedEdit,
} from "@/app/utils/adminUnsavedEdit";

const BACKUP_DEBOUNCE_MS = 1000;

export function useUnsavedEditBackup<T>(docKey: string | undefined, values: T) {
  const [backupFailed, setBackupFailed] = useState(false);
  const baseRef = useRef<T | null>(null);
  const latestValuesRef = useRef(values);

  const persist = useCallback(() => {
    const base = baseRef.current;
    if (!docKey || base === null) return;

    const current = latestValuesRef.current;
    if (isSameEdit(current, base)) {
      removeUnsavedEdit(docKey);
      setBackupFailed(false);
      return;
    }

    setBackupFailed(
      !writeUnsavedEdit(docKey, {
        savedAt: Date.now(),
        base,
        values: current,
      }),
    );
  }, [docKey]);

  useEffect(() => {
    latestValuesRef.current = values;
    const timer = setTimeout(persist, BACKUP_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [values, persist]);

  useEffect(() => {
    const persistWhenHidden = () => {
      if (document.visibilityState === "hidden") persist();
    };

    window.addEventListener("pagehide", persist);
    document.addEventListener("visibilitychange", persistWhenHidden);
    return () => {
      window.removeEventListener("pagehide", persist);
      document.removeEventListener("visibilitychange", persistWhenHidden);
      persist();
    };
  }, [persist]);

  useEffect(() => {
    removeExpiredUnsavedEdits();
  }, []);

  const beginBackup = useCallback((base: T, current: T = base) => {
    baseRef.current = base;
    latestValuesRef.current = current;
  }, []);

  const markSaved = useCallback(
    (saved: T) => {
      baseRef.current = saved;
      persist();
    },
    [persist],
  );

  const discardBackup = useCallback(() => {
    baseRef.current = null;
    if (docKey) removeUnsavedEdit(docKey);
    setBackupFailed(false);
  }, [docKey]);

  return { backupFailed, beginBackup, markSaved, discardBackup };
}
