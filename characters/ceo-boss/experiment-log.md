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
Diagnostic correction: using `generate_variations` as a readiness probe was an error and is no longer allowed; readiness must be checked only through `get_result` when available, or `get_history`.
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

## Experiment: Paid small design attempt

Date: 2026-06-18
Goal: Create a small paid CEO Boss candidate after free generations were exhausted.
Character version: v0.1-candidate
Model: FLUX.2 Klein 4B
Reference images: `images/ceo/ceo-s02p07-folded-arms.png` as the only primary input reference
Prompt: `characters/ceo-boss/prompts/base-prompt.md`
Seed: pending from FLUX result metadata
Result: submitted as FLUX request `7330e532-bab1-4ee3-8fcf-d56cb6376b13`
Consistency issues: pending visual review
What worked: used a single reference and a small 512x512 paid request to limit credit spend
What failed: pending
Decision: candidate is pending and must not be treated as canonical until visual review and explicit user approval.

### Readiness check

Date: 2026-06-18
Checked request: `7330e532-bab1-4ee3-8fcf-d56cb6376b13`
Result: ready in FLUX MCP history
Model: FLUX.2 Klein 4B
Seed: `3696246028`
Size: `512x512`
Image URL: available from FLUX MCP history
Diagnostic correction: using `generate_variations` as a readiness probe was an error and is no longer allowed; readiness must be checked only through `get_result` when available, or `get_history`.
Variation side effect: the mistaken readiness probe with `generate_variations` created four pending variation requests: `a45ec27b-8819-4aec-aa3c-07abea778cf3`, `dfc4a3bd-f4c5-4c67-bc16-e42dd1d754e8`, `c8662653-04f8-4ea5-b65a-ac6ce59736cf`, `f16a81a0-d6a6-4503-b153-440da5a62b5a`
Credits after check: `990`
Decision: candidate is not-approved because it was not approved by the user and does not meet the final Alpha PNG background standard.

### Retrieval check 3

Date: 2026-06-18
Checked request: `92f7fb91-2302-49bf-8dac-5575971199de`
Direct requestId tool: not available in the exposed FLUX MCP tools for this session.
History statuses checked: `all`, `ready`, `pending`, `failed`
Result: all history checks returned no generations.
Decision: do not use `generate_variations` as a status probe because it would create new images if the request is ready. Candidate remains unavailable for visual review.

## Experiment: Pro Alpha workflow canonical candidate

Date: 2026-06-18
Goal: Create a new CEO Boss candidate using the updated removable-background prompt and the Alpha PNG approval workflow.
Character version: v0.1-candidate
Model: FLUX.2 Pro Preview
Reference images: `images/ceo/ceo-s02p07-folded-arms.png` uploaded as FLUX media `112194dd-fc8e-4d94-8b16-88e91f3ce78a`
Prompt: `characters/ceo-boss/prompts/base-prompt.md`
Seed: pending from FLUX result metadata
Result: submitted as FLUX request `d7e56142-3b71-493c-b3f0-4d0d4463b6af`
Cost: `4.5` credits; credits changed from `990` to `985.5`
Consistency issues: pending visual review
What worked: generation request was accepted using a single source reference and the updated removable-background prompt
What failed: `get_history(status=all)` and `get_history(status=all, after=2026-06-18T13:20:00Z)` did not return the new request immediately after submission
Decision: candidate is pending/unavailable in history and must not be treated as canonical until the bitmap is ready, exported as Alpha PNG with preserved contact shadow, and explicitly approved by the user. Do not use `generate_variations` as a readiness probe.

## Decision: User-approved Alpha PNG canon

Date: 2026-06-18
Goal: Promote the user-provided background-removed CEO Boss asset to canonical reference.
Character version: v1.0-canon
Approved asset: `characters/ceo-boss/approved/ceo-boss-canon-v0.1-alpha.png`
Source URL: `https://v3b.fal.media/files/b/0a9ecbb2/Qw6fzfhUGdLq_mVVpAjAF_3qC5YJwD.png`
Verification: local file reports as `PNG image data, 512 x 512, 8-bit/color RGBA, non-interlaced`; PNG IHDR color type is `6`, so the asset has a real alpha channel.
Decision: this file is the approved full-body front canon for CEO Boss.
Workflow note: FLUX is not expected to create transparent backgrounds. Continue generating future candidates on plain high-contrast removable backgrounds, then remove the background externally/manually before approving a final Alpha PNG.
