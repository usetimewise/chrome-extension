export type NormalizedUrl = {
  domain: string;
  pathSegments: string[];
};

const PRIVATE_SEGMENT_PATTERNS = [
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  /^[A-Za-z0-9_-]{32,}$/,
  /@/
];

export function isProbablyPrivateSegment(segment: string): boolean {
  const trimmed = segment.trim();
  if (!trimmed || trimmed.length > 40) {
    return true;
  }

  if (PRIVATE_SEGMENT_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return true;
  }

  return /^(token|session|sid|auth|reset|checkout|verify)[-_]?[A-Za-z0-9_-]{12,}$/i.test(trimmed);
}

export function normalizeUrl(rawUrl: string): NormalizedUrl | null {
  try {
    const parsed = new URL(rawUrl);
    const domain = parsed.hostname.trim().toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
    if (!domain) {
      return null;
    }

    const pathSegments: string[] = [];
    for (const rawSegment of parsed.pathname.split("/")) {
      const segment = decodeURIComponent(rawSegment).trim().toLowerCase();
      if (!segment) {
        continue;
      }
      if (isProbablyPrivateSegment(segment)) {
        break;
      }

      pathSegments.push(segment);
      if (pathSegments.length === 2) {
        break;
      }
    }

    return { domain, pathSegments };
  } catch {
    return null;
  }
}
