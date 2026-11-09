import { useCallback, useState } from "react";
import { useUnsavedEditBackup } from "@/app/hooks/admin/useUnsavedEditBackup";
import { isSameEdit, readUnsavedEdit } from "@/app/utils/adminUnsavedEdit";

const RESTORE_MESSAGE = "未保存の入力内容を復元しました";

type Options<T> = {
  docKey: string | undefined;
  formValues: T;
  applyFormValues: (values: T) => void;
  hasServerCopy: boolean;
};

export function useUnsavedEditRestore<T>({
  docKey,
  formValues,
  applyFormValues,
  hasServerCopy,
}: Options<T>) {
  const [restoreMessage, setRestoreMessage] = useState("");
  const [baseValues, setBaseValues] = useState<T | null>(null);
  const [conflictingValues, setConflictingValues] = useState<T | null>(null);

  const { backupFailed, beginBackup, discardBackup } = useUnsavedEditBackup(
    docKey,
    formValues,
  );

  const applyUnsavedEdit = useCallback(
    (unsavedValues: T, base: T) => {
      applyFormValues(unsavedValues);
      setRestoreMessage(RESTORE_MESSAGE);
      beginBackup(base, unsavedValues);
    },
    [applyFormValues, beginBackup],
  );

  const loadBaseValues = useCallback(
    (base: T) => {
      setBaseValues(base);

      const unsaved = docKey ? readUnsavedEdit<T>(docKey) : null;
      if (!unsaved) {
        applyFormValues(base);
        beginBackup(base);
      } else if (!hasServerCopy || isSameEdit(unsaved.base, base)) {
        applyUnsavedEdit(unsaved.values, base);
      } else {
        applyFormValues(base);
        setConflictingValues(unsaved.values);
      }
    },
    [docKey, hasServerCopy, applyFormValues, applyUnsavedEdit, beginBackup],
  );

  const restoreConflictingEdit = useCallback(() => {
    if (conflictingValues === null || baseValues === null) return;
    applyUnsavedEdit(conflictingValues, baseValues);
    setConflictingValues(null);
  }, [applyUnsavedEdit, baseValues, conflictingValues]);

  const discardUnsavedEdit = useCallback(() => {
    if (baseValues === null) return;
    discardBackup();
    applyFormValues(baseValues);
    setRestoreMessage("");
    setConflictingValues(null);
    beginBackup(baseValues);
  }, [applyFormValues, baseValues, beginBackup, discardBackup]);

  return {
    restoreMessage,
    backupFailed,
    hasConflictingEdit: conflictingValues !== null,
    loadBaseValues,
    restoreConflictingEdit,
    discardUnsavedEdit,
    discardBackup,
  };
}
