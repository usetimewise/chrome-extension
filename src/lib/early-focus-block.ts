import { decideFocusBlock } from "./site-block-rules.js";
import type { FocusSession, SiteRuleState } from "./types.js";

export type EarlyFocusBlockDecision =
  | {
      action: "block";
      sessionId: string;
      host: string;
      category: string;
      reason: "user_block_rule" | "seed_rule" | "cached_decision";
    }
  | {
      action: "allow";
      reason: "no_active_focus_session" | "url_not_normalized" | "user_override" | "no_local_block_decision";
    };

export async function determineEarlyFocusBlock(
  rawUrl: string,
  sessions: FocusSession[] = [],
  siteRules: SiteRuleState | null = null,
  disabledDefaultBlockRuleIds: readonly string[] = []
): Promise<EarlyFocusBlockDecision> {
  const decision = await decideFocusBlock(rawUrl, {
    sessions,
    siteRules,
    disabledDefaultBlockRuleIds,
    allowNetworkLookup: false
  });
  if (decision.action === "allow") {
    return {
      action: "allow",
      reason: decision.reason === "no_block_decision" ? "no_local_block_decision" : decision.reason
    };
  }

  return {
    action: "block",
    sessionId: decision.sessionId,
    host: decision.host,
    category: decision.category,
    reason: decision.reason === "default_rule"
      ? "seed_rule"
      : decision.reason === "lookup_decision"
        ? "cached_decision"
        : decision.reason
  };
}
