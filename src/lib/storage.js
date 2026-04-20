export async function getFromStorage(key, fallback) {
  const result = await chrome.storage.local.get(key);
  return result[key] ?? fallback;
}

export async function setInStorage(key, value) {
  await chrome.storage.local.set({ [key]: value });
  return value;
}
