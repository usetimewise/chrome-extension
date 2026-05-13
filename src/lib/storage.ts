export async function getFromStorage<T>(key: string, fallback: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  return result[key] ?? fallback;
}

export async function setInStorage<T>(key: string, value: T): Promise<T> {
  await chrome.storage.local.set({ [key]: value });
  return value;
}
