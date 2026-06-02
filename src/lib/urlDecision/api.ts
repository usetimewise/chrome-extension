import { requestJSON } from "../api/client.js";
import { devDebugLog } from "../dev-debug.js";

export type LookupBucketEntry = {
  suffix: string;
  decision: "allow" | "block";
  category: string;
  confidence: number;
  rank: number;
  pattern_type: "domain" | "url_prefix";
  specificity: number;
  updated_at?: string;
};

export type LookupBucket = {
  prefix: string;
  entries: LookupBucketEntry[];
};

export type LookupBucketsResponse = {
  schema_version: number;
  prefix_bits: number;
  expires_at: string;
  buckets: LookupBucket[];
};

export async function fetchLookupBuckets(baseUrl: string, prefixes: string[]): Promise<LookupBucketsResponse> {
  const startedAt = performance.now();
  devDebugLog("urlDecision.lookupBuckets.request", {
    prefixCount: prefixes.length,
    endpoint: "/v1/url-decision/lookup-buckets"
  });

  const response = await requestJSON<LookupBucketsResponse>(baseUrl, "/v1/url-decision/lookup-buckets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      schema_version: 1,
      prefixes
    })
  });
  const normalizedResponse = normalizeLookupBucketsResponse(response);
  devDebugLog("urlDecision.lookupBuckets.response", {
    prefixCount: prefixes.length,
    bucketCount: normalizedResponse.buckets.length,
    entryCount: normalizedResponse.buckets.reduce((total, bucket) => total + bucket.entries.length, 0),
    prefixBits: normalizedResponse.prefix_bits,
    durationMs: Math.round(performance.now() - startedAt)
  });
  return normalizedResponse;
}

function normalizeLookupBucketsResponse(response: LookupBucketsResponse): LookupBucketsResponse {
  return {
    ...response,
    buckets: Array.isArray(response.buckets)
      ? response.buckets.map((bucket) => ({
          ...bucket,
          entries: Array.isArray(bucket.entries) ? bucket.entries : []
        }))
      : []
  };
}
