export type UnsavedEdit<T> = {
  savedAt: number;
  ownerId?: string;
  base: T;
  values: T;
};

const KEY_PREFIX = "admin:unsaved-edit:";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function isSameEdit<T>(a: T, b: T) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function writeUnsavedEdit<T>(docKey: string, edit: UnsavedEdit<T>) {
  try {
    window.localStorage.setItem(KEY_PREFIX + docKey, JSON.stringify(edit));
    return true;
  } catch {
    return false;
  }
}

export function removeUnsavedEdit(docKey: string) {
  try {
    window.localStorage.removeItem(KEY_PREFIX + docKey);
  } catch {
    // 消せなくても期限切れで読まれなくなるので、入力の邪魔をしない。
  }
}

export function readUnsavedEdit<T>(docKey: string): UnsavedEdit<T> | null {
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + docKey);
    if (!raw) return null;

    const edit = JSON.parse(raw) as UnsavedEdit<T>;
    if (Date.now() - edit.savedAt <= MAX_AGE_MS) return edit;
  } catch {
    // 壊れたデータは期限切れと同じく捨てる。
  }

  removeUnsavedEdit(docKey);
  return null;
}

export function removeExpiredUnsavedEdits() {
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(KEY_PREFIX))
      .forEach((key) => readUnsavedEdit(key.slice(KEY_PREFIX.length)));
  } catch {
    // 掃除できなくても入力の保持には影響しない。
  }
}
