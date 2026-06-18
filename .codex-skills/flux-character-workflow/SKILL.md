---
name: flux-character-workflow
description: Create, stabilize, edit, and review visual characters through an already connected FLUX MCP from Codex, using edit-first character packs, canonical references, prompt templates, and experiment logs.
---

# FLUX Character Workflow

Use this skill when the user wants to manually create or evolve visual characters with FLUX.2 from Codex. The workflow is repository-driven: each character has a Character Pack under `characters/<character-id>/`, and FLUX MCP is used for generation, editing, variations, and visual review.

Do not create a production backend, API service, database, task queue, or UI for this workflow. Do not integrate directly with the BFL API when the connected FLUX MCP already provides generation tools.

## First Step: Classify The Request

Before generating or editing anything, classify the user request as one of:

1. New character creation.
2. Character sheet creation.
3. New scene with an existing character.
4. Edit of an already created image.
5. Scene with multiple characters.
6. Character consistency review.
7. Controlled experiment with references, model, seed, or prompt wording.

If the request is ambiguous, ask only for the missing decision that blocks the next step. If a reasonable safe default exists, state it and continue.

## Required Repository Context

Before any generation for an existing character:

1. Locate `characters/<character-id>/`.
2. Read `character.md`.
3. Review approved references in `references/` and `approved/`.
4. Read successful prompts in `prompts/`.
5. Read `experiment-log.md`.

If the character is not fixed yet, propose creating a canonical design and character sheet first. Do not jump straight into many scene generations for an unstable character.

## Edit-First Principle

Prefer edit-first workflows over text-only regeneration:

1. Create and approve one canonical design.
2. Build a small set of canonical references.
3. Generate new scenes from the most relevant approved references.
4. State exactly what changes.
5. State exactly what remains unchanged.
6. Split complex requests into sequential edits.

Do not rely on text description alone or on seed alone for identity preservation.

## Character Pack Rules

Each character lives in:

```text
characters/<character-id>/
```

`character.md` must contain visual specification only:

- unique `character_id`
- name
- version
- character type
- visual style
- face or head shape
- skin, fur, or surface color
- exact HEX colors
- eyes
- hair, fur, or head elements
- body proportions
- base outfit
- accessories
- distinctive marks
- allowed changes
- locked invariants
- personality notes only when they affect expression or visual behavior

Avoid mixing biography, plot, and visual specification unless the visual design depends on it.

## Canonical References

Aim to collect these approved images over time:

- close-up face
- full body front view
- three-quarter view
- profile
- neutral pose
- core emotions
- back view when needed
- separate outfit or accessory reference when needed

Approved character references must be final transparent-background assets:

- PNG with a real alpha channel, not a white, gray, or prompt-only "transparent" background.
- Background fully removed from the character area.
- Soft natural contact shadow preserved under the feet as semi-transparent pixels.
- No baked-in environment background, floor texture, walls, gradients, text, props, or decorative shadows unless they are explicitly part of the approved character design.

Use the minimal sufficient reference set for each task:

- face close-up for identity
- full body for proportions
- relevant angle for pose
- style reference only when the core references do not preserve style reliably

Do not pass random, contradictory, or unapproved images as canonical references. Do not overwrite canonical references without an explicit user decision.

Treat every generated bitmap as `candidate` until it has been post-processed into the approved asset format and the user explicitly approves it. A visually strong candidate is not an approved reference until the alpha PNG export exists.

## Prompt Language

Write FLUX prompts in English even when the user speaks Russian. User-facing explanations and reports may be in Russian.

Every main prompt should contain these blocks:

1. Subject.
2. Identity preservation.
3. Requested changes.
4. Composition.
5. Style and light.

Use this base structure:

```text
[Character name and precise visual description].

Preserve the exact character identity, facial structure, skin or fur tone,
eye shape and color, hairstyle or fur silhouette, body proportions,
outfit design, accessories, and illustration style from the reference images.

Change only:
- [change 1]
- [change 2]
- [change 3]

Keep unchanged:
- [important invariant 1]
- [important invariant 2]
- [important invariant 3]

Composition:
- [shot type]
- [camera angle]
- [subject position]
- [background requirements]

Lighting and style:
- [lighting]
- [rendering style]
- [palette or HEX colors]
```

Prefer precise editing verbs:

- `Change...`
- `Replace...`
- `Add...`
- `Remove...`
- `Keep... unchanged`
- `Preserve...`

Avoid vague instructions such as `Transform the character`, `Make it completely different`, `Reimagine the person`, or `Do something creative`.

## New Character Workflow

For a new character:

1. Draft the visual specification from the user's description.
2. Fix exact HEX colors.
3. Generate several variants of the same base design.
4. Keep style, anatomy, outfit, and color scheme stable between variants.
5. Ask the user to choose a canonical variant.
6. Save the chosen image as the main reference only after approval.
7. Create additional angles from the approved image.
8. Update `character.md` after approval.

Parallel variants are useful for exploration, but do not automatically treat them as versions of the same character.

## Character Sheet Workflow

A character sheet should be technical and neutral:

- plain solid background
- even lighting
- no atmospheric effects
- no complex perspective
- no extra objects
- identical design across angles
- clearly visible outfit
- clearly visible hands, legs, tail, ears, and accessories when present

If one combined sheet causes drift between views, create the views as separate sequential edits from the canonical image.

## Existing Character Scene Workflow

For a new scene:

1. Read the Character Pack.
2. Pick the minimal approved reference set.
3. Build the preservation block from `character.md`.
4. Change only necessary scene parameters.
5. Generate a small number of limited variants.
6. Prefer editing from a suitable canonical image over generating from scratch.
7. After the user chooses a result, save the final prompt, references, model, seed when available, consistency note, and deviations.

## Multi-Character Workflow

For scenes with multiple characters:

1. Use a separate Character Pack for each character.
2. Number or name references explicitly.
3. Describe each character separately in the prompt.
4. List invariants separately for each character.
5. Specify each character's position in the frame.
6. First test a simple shared composition.
7. Only then add complex interaction.

Prompt structure:

```text
Character A: [description and preservation rules].
Character B: [description and preservation rules].

Place Character A on the left...
Place Character B on the right...

Preserve the identity and design of both characters independently.
Do not merge their facial features, colors, clothes, or accessories.
```

## Consistency Review

After generation, review the image against the Character Pack:

- face or head shape
- skin, fur, or surface tone
- eye color and eye shape
- hair or fur silhouette
- proportions
- outfit
- accessories
- number of fingers or limbs
- line style
- palette
- requested scene match

Use one status:

- `approved`: identity and design are preserved well enough.
- `needs-edit`: result is close and can be fixed with a local edit.
- `rejected`: identity or design is visibly lost.

Do not approve an image only because it is aesthetically strong.

## Controlled Experiments

Log significant experiments in `experiment-log.md`.

Compare only one main variable per experiment:

- reference set
- preservation block wording
- model
- seed
- edit order
- number of requested changes per step

Do not change everything at once, or the result cannot be interpreted.

## Model Heuristic

When model choice is available:

- FLUX.2 Max: canonical character, complex final images, critical identity fixes.
- FLUX.2 Pro: standard scenes and most iterations.
- FLUX.2 Flex: typography or readable text.
- FLUX.2 Klein: cheap draft experiments if quality is sufficient.

Do not switch model inside a controlled experiment without making model choice the tested variable.

## Seed And Variations

Treat seed as a helper, not an identity guarantee.

Use variations only when the user explicitly asks for variations or alternatives, and the requested variation fits one of these cases:

- the base result is already close
- choosing expression, pose, or a small composition difference
- the scene does not need a major rewrite

Use edit when a specific element must change while the rest stays stable.

Never use `generate_variations` to probe readiness or request status. If request-status tools are available, check readiness only through `get_result`; otherwise use `get_history`. If neither can confirm readiness, leave the request pending or unavailable and do not create variations as a diagnostic side effect.

## Templates

Use bundled templates as starting points:

- `templates/character-spec.md`
- `templates/create-character.md`
- `templates/create-character-sheet.md`
- `templates/create-scene.md`
- `templates/edit-character.md`
- `templates/add-character-to-scene.md`
- `templates/consistency-review.md`
- `templates/experiment-log.md`

Copy or adapt template content into the relevant Character Pack. Keep prompts and reports short enough to be maintainable.
