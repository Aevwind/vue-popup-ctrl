function storage(kind: 'localStorage' | 'sessionStorage'): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window[kind];
  } catch {
    // 浏览器可能因隐私设置禁止访问存储。
    return undefined;
  }
}

export function readStorage(key: string, kind: 'localStorage' | 'sessionStorage' = 'localStorage'): string | null {
  try {
    return storage(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string | null): void {
  try {
    const target = storage('localStorage');
    if (value === null) target?.removeItem(key);
    else target?.setItem(key, value);
  } catch {
    // 存储不可用时仍允许打开和关闭弹窗。
  }
}

export function storageNamespace(): string {
  return readStorage('RELEASE', 'sessionStorage')
    || (typeof window === 'undefined' ? 'vue-popup-ctrl' : window.location.origin);
}
