export const DAY_MS = 24 * 60 * 60 * 1000;

type DatePartGranularity = "date" | "dateTime";

type LocalDateParts = {
    year: string;
    month: string;
    day: string;
    hour?: string;
    minute?: string;
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function normalizedTimezone(timezone?: string | null): string {
    return timezone || "UTC";
}

function formatterFor(
    timezone: string,
    granularity: DatePartGranularity,
): Intl.DateTimeFormat {
    const key = `${normalizedTimezone(timezone)}:${granularity}`;
    const cached = formatterCache.get(key);
    if (cached) {
        return cached;
    }

    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: normalizedTimezone(timezone),
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        ...(granularity === "dateTime"
            ? {
                  hour: "2-digit",
                  minute: "2-digit",
                  hourCycle: "h23" as const,
              }
            : {}),
    });
    formatterCache.set(key, formatter);
    return formatter;
}

export function resetLocalDateFormatterCacheForTests(): void {
    formatterCache.clear();
}

export function localDateParts(
    date: Date,
    timezone?: string | null,
    granularity: DatePartGranularity = "date",
): LocalDateParts {
    const parts = formatterFor(
        normalizedTimezone(timezone),
        granularity,
    ).formatToParts(date);
    return Object.fromEntries(
        parts
            .filter((part) => part.type !== "literal")
            .map((part) => [part.type, part.value]),
    ) as LocalDateParts;
}

export function localDateKey(date: Date, timezone?: string | null): string {
    const parts = localDateParts(date, timezone, "date");
    return `${parts.year}-${parts.month}-${parts.day}`;
}

export function localHour(date: Date, timezone?: string | null): number {
    return Number(localDateParts(date, timezone, "dateTime").hour || 0);
}

export function localMinuteOfDay(date: Date, timezone?: string | null): number {
    const parts = localDateParts(date, timezone, "dateTime");
    return Number(parts.hour || 0) * 60 + Number(parts.minute || 0);
}

export function utcInstantForLocalTime(
    dateKey: string,
    hour: number,
    timezone?: string | null,
): string {
    const [year, month, day] = dateKey.split("-").map(Number);
    const targetUtc = Date.UTC(year, month - 1, day, hour, 0, 0, 0);
    let guess = targetUtc;

    for (let index = 0; index < 3; index += 1) {
        const parts = localDateParts(new Date(guess), timezone, "dateTime");
        const localAsUtc = Date.UTC(
            Number(parts.year),
            Number(parts.month) - 1,
            Number(parts.day),
            Number(parts.hour || 0),
            Number(parts.minute || 0),
            0,
            0,
        );
        guess += targetUtc - localAsUtc;
    }

    return new Date(guess).toISOString();
}
