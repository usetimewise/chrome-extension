export async function getFromStorage<T>(key: string, fallback: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  return result[key] ?? fallback;
}

export async function setInStorage<T>(key: string, value: T): Promise<T> {
  await chrome.storage.local.set({ [key]: value });
  return value;
}

export async function getManyFromStorage<T = unknown>(keys: string[]): Promise<Record<string, T>> {
  return chrome.storage.local.get(keys) as Promise<Record<string, T>>;
}

export async function setManyInStorage(values: Record<string, unknown>): Promise<void> {
  await chrome.storage.local.set(values);
}

export async function removeFromStorage(key: string): Promise<void> {
  await chrome.storage.local.remove(key);
}
