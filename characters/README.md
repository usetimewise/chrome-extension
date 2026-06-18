# Characters

This directory stores manual Character Packs for FLUX character workflows.

Each character should live in:

```text
characters/<character-id>/
```

Start by copying `characters/_template/` and renaming the copy to the new `character_id`.

## Character Pack Contents

- `character.md`: canonical visual specification and invariants.
- `references/`: approved identity, angle, outfit, accessory, and expression references.
- `approved/`: final approved outputs worth preserving.
- `experiments/`: generated experiment outputs or notes grouped by task.
- `prompts/base-prompt.md`: stable base identity prompt.
- `prompts/scene-prompt.md`: reusable scene prompt structure.
- `prompts/edit-prompt.md`: reusable edit prompt structure.
- `experiment-log.md`: controlled experiment history and decisions.

Do not mix references from different characters. Do not treat generated images as approved references until the user explicitly approves them.
