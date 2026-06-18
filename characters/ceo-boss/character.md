# CEO Boss

## Identity

- character_id: ceo-boss
- name: CEO Boss
- version: v1.0-canon
- character type: stylized chibi corporate executive mascot
- visual style: glossy 3D toy-like chibi render with soft studio lighting, smooth rounded forms, compact body, oversized head, clean commercial mascot finish

## Canon Direction

This Character Pack was created from the variable source series in `images/ceo/`.
The current goal is not to preserve every difference from that series. The goal is
to extract one stable design and remove visual drift.

Primary design source:

- `images/ceo/ceo-s02p07-folded-arms.png`

Use other `images/ceo/*.png` files only as source candidates for broad style
context until the user explicitly approves them as canonical references.

## Core Visual Design

- face or head shape: oversized rounded square chibi head, broad forehead, soft cheeks, small rounded nose, small downturned mouth
- skin, fur, or surface tone: warm peach vinyl-like skin, soft subsurface shading
- exact HEX colors:
  - skin base: `#E2B18E`
  - skin highlight: `#F1C8A6`
  - skin shadow: `#B98264`
  - hair: `#111111`
  - eyebrow: `#0F0F0F`
  - suit black: `#151515`
  - suit highlight: `#2B2B2B`
  - shirt: `#F2F2EE`
  - tie red: `#D71920`
  - shoe black: `#101010`
  - temporary removable background: `#85898B`
- eyes: narrow stern black eyes with heavy upper lids, small dark pupils, no large cute sparkle highlights
- hair, fur, or head elements: glossy black sculpted executive hair, side-parted and swept back as a single clean helmet-like shape with subtle grooves; no facial hair
- body proportions: chibi proportions, head about half of total height, short compact torso, short legs, small hands, broad stance
- base outfit: fitted black business suit with lapels, white shirt, red necktie, black trousers, black dress shoes
- accessories: none as a permanent accessory
- distinctive marks: very thick angled black eyebrows, stern frown, compact CEO posture, red tie as the only saturated color accent

## Invariants

These elements must remain unchanged unless the user explicitly approves a new version:

- exact character identity: stern chibi CEO mascot, not a realistic human executive
- facial structure: rounded square oversized head, small nose, small frowning mouth, no beard, no mustache
- skin, fur, or surface tone: warm peach toy-like material using the locked skin palette
- eye shape and color: narrow stern dark eyes under heavy lids
- hair or fur silhouette: glossy black side-parted swept-back executive hair
- body proportions: oversized head, compact body, short legs and arms
- outfit design: black suit, white shirt, red tie, black shoes
- accessories: no permanent glasses, watch, phone, clipboard, pen, speech bubble, chart, or table
- illustration style: glossy 3D chibi toy render
- approved reference background: transparent Alpha PNG with a preserved soft natural contact shadow under the feet

## Allowed Changes

- expressions: stern, annoyed, impatient, skeptical, focused; keep the face recognizably strict
- poses: arms folded, pointing, hand raised, checking watch, holding document, tapping table, standing neutral
- lighting: neutral studio, soft office light, mild dramatic key light
- backgrounds: transparent Alpha PNG for approved references; plain solid high-contrast removable background only for temporary generation or work-in-progress assets; simple office, meeting room, dashboard screen, desk area for scene images
- temporary props: phone, clipboard, pen, report, chart, watch, table, speech bubble
- seasonal or scene-specific clothing: not allowed until a new outfit version is explicitly approved

## Locked Elements

These elements must not change:

- no hairstyle switching between grooved slick-back and flat side-cap variants within one canonical set
- no change to red tie color
- no change from black suit to another outfit
- no change to realistic adult-human proportions
- no soft smiling default expression
- no permanent prop treated as part of the body design
- no alternate eye color or large round eyes
- no facial hair

## Visual Behavior

Only include personality traits that affect expression, posture, or visual acting:

- visually strict, impatient, directive, and managerial
- posture should feel compact, controlled, and authoritative
- gestures should read as decisive rather than playful

## Canonical References

Approved canonical reference:

- full body front: `characters/ceo-boss/approved/ceo-boss-canon-v0.1-alpha.png`
- source URL: `https://v3b.fal.media/files/b/0a9ecbb2/Qw6fzfhUGdLq_mVVpAjAF_3qC5YJwD.png`
- approval: user-approved Alpha PNG canon, 2026-06-18
- asset status: approved; PNG RGBA with real alpha channel

Generated candidate:

- base canonical candidate: FLUX request `92f7fb91-2302-49bf-8dac-5575971199de`
- retry base canonical candidate: FLUX request `04d9c324-afb2-4d3c-a6d4-ad3bfcd0646b`
- paid small candidate: FLUX request `7330e532-bab1-4ee3-8fcf-d56cb6376b13` - not-approved; not user-approved and not exported as a final transparent Alpha PNG with preserved contact shadow
- Pro Alpha workflow candidate: FLUX request `d7e56142-3b71-493c-b3f0-4d0d4463b6af` - pending; submitted with removable-background prompt and not approved

- base source candidate: `images/ceo/ceo-s02p07-folded-arms.png`
- face close-up: pending
- three-quarter view: pending
- profile: pending
- neutral pose: pending
- core emotions: pending
- back view: pending
- outfit or accessory reference: pending

## Source Candidate Review

- `images/ceo/ceo-s02p01-kpi-frown.png`: useful for face/frown and chart prop, but hair grooves and eye spacing differ from the chosen base.
- `images/ceo/ceo-s02p02-phone-no.png`: useful for stop gesture and phone prop, but pose and face angle are not canonical.
- `images/ceo/ceo-s02p03-watch-tap.png`: useful for watch gesture, but body proportions are taller and hair is flatter.
- `images/ceo/ceo-s02p04-clipboard-flip.png`: useful for clipboard prop, but face and eyelids drift.
- `images/ceo/ceo-s02p05-pinch-bridge.png`: useful for stressed expression, but hair grooves and three-quarter angle should not override the base.
- `images/ceo/ceo-s02p06-meeting-call.png`: useful for speech bubble scene only; text bubble is not part of character identity.
- `images/ceo/ceo-s02p07-folded-arms.png`: selected as primary base candidate because it has clean full-body front composition without temporary props.
- `images/ceo/ceo-s02p08-redline-pen.png`: useful for red pen prop, but eyes are too round and body is heavier.
- `images/ceo/ceo-s02p09-firm-stare.png`: useful for stern front-facing expression, but not full-body enough for base proportions.
- `images/ceo/ceo-s02p10-tap-table.png`: useful for table-tap scene, but hair grooves and table prop should remain scene-specific.

## Notes

- This Character Pack has an approved full-body front canon.
- Approved character references must be true Alpha PNG assets with transparent background and preserved semi-transparent contact shadow under the feet.
- FLUX does not produce final transparency directly. Plain gray or other solid backgrounds are allowed only as temporary generation backgrounds for later external/manual removal, not as final canonical references.
- Do not place the full `images/ceo` set into one FLUX request when the goal is consistency; it will encourage averaging and drift.
- Generated candidates `92f7fb91-2302-49bf-8dac-5575971199de`, `04d9c324-afb2-4d3c-a6d4-ad3bfcd0646b`, `7330e532-bab1-4ee3-8fcf-d56cb6376b13`, and `d7e56142-3b71-493c-b3f0-4d0d4463b6af` must not be copied into `approved/` until explicitly accepted and exported as Alpha PNG assets.
