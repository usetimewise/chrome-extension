# CEO Boss Experiment Log

## Experiment: Extract stable canonical design from variable source series

Date: 2026-06-18
Goal: Create one stable CEO Boss canonical design from the inconsistent `images/ceo` series without preserving the unwanted variation between source images.
Character version: v0.1-candidate
Model: FLUX.2 Max planned for canonical generation
Reference images: `images/ceo/ceo-s02p07-folded-arms.png` as the only primary input reference
Prompt: `characters/ceo-boss/prompts/base-prompt.md`
Seed: pending from FLUX result metadata
Result: submitted as FLUX request `92f7fb91-2302-49bf-8dac-5575971199de`
Consistency issues: source series has visible drift in hairstyle, eye shape, proportions, facial expression, and temporary props
What worked: selected a single clean full-body source candidate instead of using the full mixed set
What failed: pending visual review of generated candidate
Decision: do not treat `images/ceo/*.png` as approved canonical references; use them only as source candidates until the user approves a generated canonical image. Do not approve request `92f7fb91-2302-49bf-8dac-5575971199de` automatically.

### Retrieval check

Date: 2026-06-18
Checked request: `92f7fb91-2302-49bf-8dac-5575971199de`
Result: FLUX MCP `get_history` returned no ready or pending generations, so the generated bitmap is not available for visual consistency review from Codex yet.
Decision: keep candidate status as pending; do not approve or reject without seeing the image.

### Retrieval check 2

Date: 2026-06-18
Checked request: `92f7fb91-2302-49bf-8dac-5575971199de`
Result: FLUX MCP `get_history` still returned no ready or pending generations.
Decision: candidate remains unavailable for visual review; keep status pending and do not approve as canon.

### Variation readiness check

Date: 2026-06-18
Checked request: `92f7fb91-2302-49bf-8dac-5575971199de`
Method: FLUX MCP `generate_variations` with `count=4`
Result: `VARIATION_SOURCE_NOT_READY`; source exists but status is `pending`, and variations require a `ready` source.
Decision: request is not lost, but no finished bitmap is available yet. Do not approve, reject, or build canonical references from this pending candidate.

## Experiment: Retry stable canonical design with Pro

Date: 2026-06-18
Goal: Create an accessible stable CEO Boss canonical candidate after the initial Max request remained pending.
Character version: v0.1-candidate
Model: FLUX.2 Pro Preview
Reference images: `images/ceo/ceo-s02p07-folded-arms.png` as the only primary input reference
Prompt: `characters/ceo-boss/prompts/base-prompt.md`
Seed: pending from FLUX result metadata
Result: submitted as FLUX request `04d9c324-afb2-4d3c-a6d4-ad3bfcd0646b`
Consistency issues: pending visual review
What worked: kept the same single-reference setup and changed only the model from Max to Pro to avoid repeating the stuck request exactly
What failed: pending
Decision: candidate is pending and must not be treated as canonical until visual review and explicit user approval.

### Retrieval check 3

Date: 2026-06-18
Checked request: `92f7fb91-2302-49bf-8dac-5575971199de`
Direct requestId tool: not available in the exposed FLUX MCP tools for this session.
History statuses checked: `all`, `ready`, `pending`, `failed`
Result: all history checks returned no generations.
Decision: do not use `generate_variations` as a status probe because it would create new images if the request is ready. Candidate remains unavailable for visual review.
