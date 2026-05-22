const DAY_IN_MS = 24 * 60 * 60 * 1000;

type BrowserHistoryEntry = {
  item: chrome.history.HistoryItem;
  visits: chrome.history.VisitItem[];
};

type BrowserHistoryDump = {
  queriedAt: string;
  periodDays: number;
  startTime: string;
  endTime: string;
  totalItems: number;
  entries: BrowserHistoryEntry[];
};

async function loadVisits(url: string | undefined): Promise<chrome.history.VisitItem[]> {
  if (!url) {
    return [];
  }

  return chrome.history.getVisits({ url });
}

export async function logRecentBrowserHistory(periodDays = 3): Promise<void> {
  const endTime = Date.now();
  const startTime = endTime - periodDays * DAY_IN_MS;
  const items = await chrome.history.search({
    text: "",
    startTime,
    endTime,
    maxResults: 0
  });

  const entries = await Promise.all(
    items.map(async (item) => ({
      item,
      visits: await loadVisits(item.url)
    }))
  );

  const payload: BrowserHistoryDump = {
    queriedAt: new Date().toISOString(),
    periodDays,
    startTime: new Date(startTime).toISOString(),
    endTime: new Date(endTime).toISOString(),
    totalItems: entries.length,
    entries
  };

  console.groupCollapsed(`[TimeWise][dev] Browser history dump: ${payload.totalItems} items`);
  console.log(payload);
  console.groupEnd();
}
