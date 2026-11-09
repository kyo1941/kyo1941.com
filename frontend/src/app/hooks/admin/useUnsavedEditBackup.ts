import { useCallback, useEffect, useRef, useState } from "react";
import {
  isSameEdit,
  readUnsavedEdit,
  removeExpiredUnsavedEdits,
  removeUnsavedEdit,
  writeUnsavedEdit,
} from "@/app/utils/adminUnsavedEdit";

const BACKUP_DEBOUNCE_MS = 1000;

export function useUnsavedEditBackup<T>(docKey: string | undefined, values: T) {
  const [backupFailed, setBackupFailed] = useState(false);
  const [tabId] = useState(() => crypto.randomUUID());
  const baseRef = useRef<T | null>(null);
  const latestValuesRef = useRef(values);
  const persistedValuesRef = useRef<T | null>(null);

  const persist = useCallback(() => {
    const base = baseRef.current;
    if (!docKey || base === null) return;

    const current = latestValuesRef.current;
    // 入力していないタブがタブ切り替えや閉じる操作で書き込むと、別のタブの新しい入力を古い内容で上書きしてしまう。
    if (
      persistedValuesRef.current !== null &&
      isSameEdit(current, persistedValuesRef.current)
    ) {
      return;
    }
    persistedValuesRef.current = current;

    if (isSameEdit(current, base)) {
      // 入力を元に戻しただけのタブが、同じ記事を編集している別のタブの退避データを消さないようにする。
      if (readUnsavedEdit(docKey)?.ownerId === tabId) {
        removeUnsavedEdit(docKey);
      }
      setBackupFailed(false);
      return;
    }

    const written = writeUnsavedEdit(docKey, {
      savedAt: Date.now(),
      ownerId: tabId,
      base,
      values: current,
    });
    if (!written) persistedValuesRef.current = null;
    setBackupFailed(!written);
  }, [docKey, tabId]);

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

  const beginBackup = useCallback(
    (base: T, current: T = base) => {
      baseRef.current = base;
      latestValuesRef.current = current;
      if (isSameEdit(current, base)) {
        persistedValuesRef.current = current;
        return;
      }
      // 復元した入力はすぐ書き直して、このタブの退避データにする。
      // 元にしたサーバーの内容も新しくなり、手で元に戻したときに消せるようになる。
      persistedValuesRef.current = null;
      persist();
    },
    [persist],
  );

  const discardBackup = useCallback(() => {
    baseRef.current = null;
    persistedValuesRef.current = null;
    if (docKey) removeUnsavedEdit(docKey);
    setBackupFailed(false);
  }, [docKey]);

  return { backupFailed, beginBackup, discardBackup };
}
