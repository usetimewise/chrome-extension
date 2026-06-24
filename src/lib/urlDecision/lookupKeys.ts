import type { NormalizedUrl } from "./normalizeUrl.js";

export function buildLookupKeys(normalized: NormalizedUrl): string[] {
    const keys = [`d:${normalized.domain}`];
    const [firstSegment, secondSegment] = normalized.pathSegments;

    if (firstSegment) {
        keys.push(`p1:${normalized.domain}/${firstSegment}`);
    }
    if (firstSegment && secondSegment) {
        keys.push(`p2:${normalized.domain}/${firstSegment}/${secondSegment}`);
    }

    return keys;
}

export function parentDomainCandidates(domain: string): string[] {
    const normalized = domain
        .trim()
        .toLowerCase()
        .replace(/^www\./, "")
        .replace(/\.$/, "");
    const labels = normalized.split(".").filter(Boolean);
    const candidates = [normalized];
    if (labels.length <= 2) {
        return candidates;
    }

    const lastTwo = labels.slice(-2).join(".");
    const lastThree = labels.slice(-3).join(".");
    const secondLevelSuffixes = new Set([
        "ac",
        "co",
        "com",
        "edu",
        "gov",
        "net",
        "org",
    ]);
    if (
        labels.at(-1)?.length === 2 &&
        secondLevelSuffixes.has(labels.at(-2) || "") &&
        lastThree !== normalized
    ) {
        candidates.push(lastThree);
    }
    if (!candidates.includes(lastTwo)) {
        candidates.push(lastTwo);
    }

    return candidates;
}

export function buildLookupKeyCandidates(normalized: NormalizedUrl): string[] {
    const seen = new Set<string>();
    const keys: string[] = [];

    for (const domain of parentDomainCandidates(normalized.domain)) {
        for (const key of buildLookupKeys({ ...normalized, domain })) {
            if (!seen.has(key)) {
                seen.add(key);
                keys.push(key);
            }
        }
    }

    return keys;
}
