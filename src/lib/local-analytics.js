import {
  DISTRACTION_CATEGORIES,
  FOCUS_CATEGORIES
} from "./constants.js";
import { hostMatchesRule } from "./utils.js";

const DEFAULT_CATEGORY_CATALOG = {
  "github.com": "work",
  "gitlab.com": "work",
  "jira.com": "work",
  "linear.app": "work",
  "figma.com": "work",
  "notion.so": "work",
  "docs.google.com": "work",
  "meet.google.com": "communication",
  "slack.com": "communication",
  "mail.google.com": "communication",
  "gmail.com": "communication",
  "telegram.org": "communication",
  "coursera.org": "learning",
  "udemy.com": "learning",
  "wikipedia.org": "learning",
  "stackoverflow.com": "learning",
  "reddit.com": "social",
  "x.com": "social",
  "twitter.com": "social",
  "facebook.com": "social",
  "instagram.com": "social",
  "linkedin.com": "social",
  "youtube.com": "entertainment",
  "netflix.com": "entertainment",
  "twitch.tv": "entertainment",
  "steamcommunity.com": "entertainment",
  "amazon.com": "shopping",
  "ebay.com": "shopping",
  "aliexpress.com": "shopping",
  "nytimes.com": "news",
  "news.ycombinator.com": "news",
  "medium.com": "news"
};

function localDateParts(date, timezone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}

function localDateKey(date, timezone) {
  const parts = localDateParts(date, timezone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function localHour(date, timezone) {
  return Number(localDateParts(date, timezone).hour || 0);
}

function weekdayForDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function normalizeHost(host) {
  return String(host || "").trim().toLowerCase().replace(/^www\./, "");
}

export function resolveCategory(host, settings = {}) {
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) {
    return "other";
  }

  if ((settings.excludedHosts || []).some((rule) => hostMatchesRule(normalizedHost, rule))) {
    return "excluded";
  }

  for (const [overrideHost, category] of Object.entries(settings.categoryOverrides || {})) {
    if (hostMatchesRule(normalizedHost, overrideHost)) {
      return category;
    }
  }

  for (const [catalogHost, category] of Object.entries(DEFAULT_CATEGORY_CATALOG)) {
    if (hostMatchesRule(normalizedHost, catalogHost)) {
      return category;
    }
  }

  if (normalizedHost.includes("docs") || normalizedHost.includes("calendar") || normalizedHost.includes("workspace")) {
    return "tools";
  }
  if (normalizedHost.includes("mail") || normalizedHost.includes("chat") || normalizedHost.includes("meet")) {
    return "communication";
  }
  if (normalizedHost.includes("shop") || normalizedHost.includes("market")) {
    return "shopping";
  }
  if (normalizedHost.includes("news")) {
    return "news";
  }
  if (normalizedHost.includes("learn") || normalizedHost.includes("course") || normalizedHost.includes("academy")) {
    return "learning";
  }

  return "other";
}

function eventsForDate(events, timezone, key) {
  return events.filter((event) => {
    const occurredAt = new Date(event.occurred_at || "");
    return !Number.isNaN(occurredAt.getTime()) && localDateKey(occurredAt, timezone) === key;
  });
}

function isWithinWorkHours(event, settings, timezone) {
  const occurredAt = new Date(event.occurred_at || "");
  if (Number.isNaN(occurredAt.getTime())) {
    return false;
  }

  const dateKey = localDateKey(occurredAt, timezone);
  const rawWeekday = weekdayForDateKey(dateKey);
  const weekday = rawWeekday === 0 ? 7 : rawWeekday;
  if ((settings.workdays || []).length && !settings.workdays.includes(weekday)) {
    return false;
  }

  const parts = localDateParts(occurredAt, timezone);
  const minuteOfDay = Number(parts.hour || 0) * 60 + Number(parts.minute || 0);
  const [startHour, startMinute] = String(settings.workHoursStart || "09:00").split(":").map(Number);
  const [endHour, endMinute] = String(settings.workHoursEnd || "18:00").split(":").map(Number);
  const start = (startHour || 0) * 60 + (startMinute || 0);
  const end = (endHour || 0) * 60 + (endMinute || 0);
  return minuteOfDay >= start && minuteOfDay < end;
}

function alignmentWeight(event, settings, timezone) {
  const inWork = isWithinWorkHours(event, settings, timezone);
  if (FOCUS_CATEGORIES.has(event.category) && inWork) {
    return 1;
  }
  if (event.category === "communication" && inWork) {
    return 0.65;
  }
  if (DISTRACTION_CATEGORIES.has(event.category) && inWork) {
    return 0;
  }
  if (!inWork && DISTRACTION_CATEGORIES.has(event.category)) {
    return 0.35;
  }
  return 0.5;
}

function sortByDurationThenName(a, b, nameKey) {
  if ((a.duration_ms || 0) === (b.duration_ms || 0)) {
    return String(a[nameKey] || "").localeCompare(String(b[nameKey] || ""));
  }
  return (b.duration_ms || 0) - (a.duration_ms || 0);
}

function summarize(events, settings, rangeName, rangeKey, now = new Date()) {
  const timezone = settings.timezone || "UTC";
  const siteDurations = new Map();
  const siteCategories = new Map();
  const categoryDurations = new Map();
  let totalDurationMs = 0;
  let focusDurationMs = 0;
  let distractionDurationMs = 0;
  let alignmentWeighted = 0;

  for (const rawEvent of events) {
    const category = rawEvent.category || resolveCategory(rawEvent.host, settings);
    if (category === "excluded") {
      continue;
    }

    const durationMs = Number(rawEvent.duration_ms || 0);
    totalDurationMs += durationMs;
    siteDurations.set(rawEvent.host, (siteDurations.get(rawEvent.host) || 0) + durationMs);
    siteCategories.set(rawEvent.host, category);
    categoryDurations.set(category, (categoryDurations.get(category) || 0) + durationMs);
    if (FOCUS_CATEGORIES.has(category)) {
      focusDurationMs += durationMs;
    }
    if (DISTRACTION_CATEGORIES.has(category)) {
      distractionDurationMs += durationMs;
    }
    alignmentWeighted += durationMs * alignmentWeight({ ...rawEvent, category }, settings, timezone);
  }

  const topSites = Array.from(siteDurations.entries())
    .map(([host, durationMs]) => ({
      host,
      category: siteCategories.get(host) || "other",
      duration_ms: durationMs
    }))
    .sort((a, b) => sortByDurationThenName(a, b, "host"))
    .slice(0, 8);

  const topCategories = Array.from(categoryDurations.entries())
    .map(([category, durationMs]) => ({
      category,
      duration_ms: durationMs,
      share: totalDurationMs > 0 ? durationMs / totalDurationMs : 0
    }))
    .sort((a, b) => sortByDurationThenName(a, b, "category"));

  return {
    range: rangeName,
    range_start: `${rangeKey}T00:00:00.000Z`,
    range_end: now.toISOString(),
    total_duration_ms: totalDurationMs,
    focus_duration_ms: focusDurationMs,
    distraction_duration_ms: distractionDurationMs,
    focus_score: totalDurationMs > 0 ? focusDurationMs / totalDurationMs : 0,
    focus_alignment: totalDurationMs > 0 ? alignmentWeighted / totalDurationMs : 0,
    top_sites: topSites,
    top_categories: topCategories,
    event_count: events.length
  };
}

function buildStatus(summary) {
  if (!summary.total_duration_ms) {
    return {
      label: "Starting out",
      tone: "neutral",
      message: "Your focus picture will appear once enough browsing time has been tracked."
    };
  }
  if (summary.focus_alignment >= 0.67) {
    return {
      label: "On track",
      tone: "positive",
      message: "Your day is mostly aligned with focused work so far."
    };
  }
  if (summary.focus_alignment >= 0.45) {
    return {
      label: "Slightly drifting",
      tone: "caution",
      message: "Attention is mixed today. This is a good moment to reset, not to judge."
    };
  }
  return {
    label: "Distracted",
    tone: "warning",
    message: "Distracting categories are taking more space than usual right now."
  };
}

function buildComparison(current, previous) {
  return {
    label: "vs yesterday",
    focus_delta_ms: current.focus_duration_ms - previous.focus_duration_ms,
    distraction_delta_ms: current.distraction_duration_ms - previous.distraction_duration_ms,
    focus_alignment_delta: current.focus_alignment - previous.focus_alignment,
    focused_time_yesterday_ms: previous.focus_duration_ms
  };
}

function topDistractingSite(summary) {
  return (summary.top_sites || []).find((site) => DISTRACTION_CATEGORIES.has(site.category))?.host || "";
}

function strongestFocusBlock(events, settings) {
  const timezone = settings.timezone || "UTC";
  const byHour = new Map();
  for (const event of events) {
    const category = event.category || resolveCategory(event.host, settings);
    if (!FOCUS_CATEGORIES.has(category)) {
      continue;
    }
    const occurredAt = new Date(event.occurred_at || "");
    if (Number.isNaN(occurredAt.getTime())) {
      continue;
    }
    const hour = localHour(occurredAt, timezone);
    byHour.set(hour, (byHour.get(hour) || 0) + Number(event.duration_ms || 0));
  }
  const best = Array.from(byHour.entries()).sort((a, b) => b[1] - a[1])[0];
  if (!best || best[1] < 20 * 60 * 1000) {
    return "";
  }
  const label = `${String(best[0]).padStart(2, "0")}:00`;
  return `Your strongest focused time today is around ${label}.`;
}

function topDistractionHour(events, settings) {
  const timezone = settings.timezone || "UTC";
  const byHour = new Map();
  for (const event of events) {
    const category = event.category || resolveCategory(event.host, settings);
    if (!DISTRACTION_CATEGORIES.has(category)) {
      continue;
    }
    const occurredAt = new Date(event.occurred_at || "");
    if (Number.isNaN(occurredAt.getTime())) {
      continue;
    }
    const hour = localHour(occurredAt, timezone);
    byHour.set(hour, (byHour.get(hour) || 0) + Number(event.duration_ms || 0));
  }
  const best = Array.from(byHour.entries()).sort((a, b) => b[1] - a[1])[0];
  if (!best || best[1] <= 0) {
    return "";
  }
  return `${String(best[0]).padStart(2, "0")}:00`;
}

function buildMainInsight(summary, events, settings) {
  if (!summary.total_duration_ms) {
    return {
      id: "empty-day",
      title: "Your focus picture is still forming",
      body: "Keep browsing normally. The first meaningful pattern appears after enough tracked time accumulates.",
      emphasis: "neutral"
    };
  }

  const block = strongestFocusBlock(events, settings);
  if (block) {
    return {
      id: "focus-block",
      title: "Your strongest focus block is already visible",
      body: block,
      emphasis: "positive"
    };
  }

  const topSite = summary.top_sites?.[0]?.host || "one site";
  return {
    id: "top-site",
    title: "One site is shaping the day more than the rest",
    body: `${topSite} currently holds the biggest share of your attention.`,
    emphasis: "neutral"
  };
}

function buildSupportingInsights(summary, events, settings) {
  const items = [];
  const hour = topDistractionHour(events, settings);
  if (hour) {
    items.push({
      id: "distraction-hour",
      title: "Drift clusters at a specific time",
      body: `Distracting time peaks around ${hour}, which is where a lighter reset would help most.`,
      emphasis: "caution"
    });
  }
  const site = topDistractingSite(summary);
  if (site) {
    items.push({
      id: "distracting-site",
      title: "One site is leading distraction today",
      body: `${site} is the clearest source of drift in the current day.`,
      emphasis: "warning",
      action: { type: "reclassify_site", label: "Review site rule", payload: { host: site } }
    });
  }
  if (items.length) {
    return items.slice(0, 3);
  }
  return [{
    id: "steady",
    title: "The day is readable",
    body: "The current pattern is clear enough for a short review later.",
    emphasis: "neutral"
  }];
}

function buildRecommendations(current, previous) {
  const recommendations = [];
  if (current.total_duration_ms >= 30 * 60 * 1000 && current.focus_alignment < 0.45) {
    recommendations.push({
      id: "start-focus",
      type: "focus_reset",
      priority: "high",
      title: "Use one clear focus block",
      body: "A 45-minute block will do more for the rest of the day than trying to fix every distracting tab at once.",
      reason_codes: ["low_alignment"],
      action: { type: "start_focus_session", label: "Start focus mode", payload: { minutes: 45 } }
    });
  }
  if (current.distraction_duration_ms > previous.distraction_duration_ms + 20 * 60 * 1000) {
    recommendations.push({
      id: "review-pattern",
      type: "trend",
      priority: "medium",
      title: "Distraction is above yesterday's pace",
      body: "The change is large enough to be worth noticing. Check whether one site or one time block is responsible.",
      reason_codes: ["distraction_up"],
      action: { type: "open_dashboard_tab", label: "Open insights", payload: { tab: "insights" } }
    });
  }
  const site = topDistractingSite(current);
  if (site) {
    recommendations.push({
      id: "reclassify",
      type: "classification",
      priority: "low",
      title: "Teach the tracker one correction",
      body: "If the top distracting site is intentional work for you, reclassify it so focus alignment stays trustworthy.",
      reason_codes: ["classification_trust"],
      action: { type: "reclassify_site", label: "Review site", payload: { host: site } }
    });
  }
  if (!recommendations.length) {
    recommendations.push({
      id: "steady-state",
      type: "reflection",
      priority: "low",
      title: "Keep the current pace",
      body: "The current day does not need a dramatic correction. A short review later is enough.",
      reason_codes: ["steady"],
      action: { type: "open_dashboard_tab", label: "Open dashboard", payload: { tab: "today" } }
    });
  }
  return recommendations;
}

function buildTimeline(events, settings, dateKey) {
  const timezone = settings.timezone || "UTC";
  const points = Array.from({ length: 24 }, (_, hour) => ({
    label: `${String(hour).padStart(2, "0")}:00`,
    bucket_start: `${dateKey}T${String(hour).padStart(2, "0")}:00:00.000Z`,
    total_duration_ms: 0,
    focus_duration_ms: 0,
    distraction_duration_ms: 0
  }));

  for (const event of events) {
    const occurredAt = new Date(event.occurred_at || "");
    if (Number.isNaN(occurredAt.getTime())) {
      continue;
    }
    const point = points[localHour(occurredAt, timezone)];
    const durationMs = Number(event.duration_ms || 0);
    const category = event.category || resolveCategory(event.host, settings);
    point.total_duration_ms += durationMs;
    if (FOCUS_CATEGORIES.has(category)) {
      point.focus_duration_ms += durationMs;
    }
    if (DISTRACTION_CATEGORIES.has(category)) {
      point.distraction_duration_ms += durationMs;
    }
  }
  return points;
}

export function buildTodayView(events = [], settings = {}, now = new Date()) {
  const timezone = settings.timezone || "UTC";
  const todayKey = localDateKey(now, timezone);
  const yesterdayKey = localDateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000), timezone);
  const todayEvents = eventsForDate(events, timezone, todayKey);
  const yesterdayEvents = eventsForDate(events, timezone, yesterdayKey);
  const todaySummary = summarize(todayEvents, settings, "today", todayKey, now);
  const yesterdaySummary = summarize(yesterdayEvents, settings, "yesterday", yesterdayKey, now);

  return {
    status: buildStatus(todaySummary),
    summary: todaySummary,
    comparison: buildComparison(todaySummary, yesterdaySummary),
    timeline: buildTimeline(todayEvents, settings, todayKey),
    top_categories: todaySummary.top_categories,
    top_sites: todaySummary.top_sites,
    main_insight: buildMainInsight(todaySummary, todayEvents, settings),
    supporting_insights: buildSupportingInsights(todaySummary, todayEvents, settings),
    recommendations: buildRecommendations(todaySummary, yesterdaySummary)
  };
}

export function buildSitesView(events = [], settings = {}, now = new Date()) {
  const timezone = settings.timezone || "UTC";
  const todayKey = localDateKey(now, timezone);
  const weekCutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const itemsByHost = new Map();

  for (const event of events) {
    const occurredAt = new Date(event.occurred_at || "");
    if (Number.isNaN(occurredAt.getTime()) || occurredAt.getTime() < weekCutoff) {
      continue;
    }
    const category = event.category || resolveCategory(event.host, settings);
    const current = itemsByHost.get(event.host) || {
      host: event.host,
      category,
      time_today_ms: 0,
      time_week_ms: 0,
      last_active_at: event.occurred_at,
      focus_impact: "neutral",
      manual: Boolean(settings.categoryOverrides?.[event.host]),
      excluded: category === "excluded"
    };
    current.time_week_ms += Number(event.duration_ms || 0);
    if (localDateKey(occurredAt, timezone) === todayKey) {
      current.time_today_ms += Number(event.duration_ms || 0);
    }
    if (Date.parse(event.occurred_at) > Date.parse(current.last_active_at)) {
      current.last_active_at = event.occurred_at;
    }
    if (FOCUS_CATEGORIES.has(category)) {
      current.focus_impact = "supportive";
    } else if (DISTRACTION_CATEGORIES.has(category)) {
      current.focus_impact = "disruptive";
    }
    itemsByHost.set(event.host, current);
  }

  return {
    items: Array.from(itemsByHost.values()).sort((a, b) => b.time_week_ms - a.time_week_ms),
    rules: [
      ...Object.entries(settings.categoryOverrides || {}).map(([host, category]) => ({ host, category })),
      ...(settings.excludedHosts || []).map((host) => ({ host, excluded: true }))
    ].sort((a, b) => a.host.localeCompare(b.host)),
    suggestions: [],
    available_filters: ["all", "productive", "neutral", "distracting", "uncategorized"]
  };
}
