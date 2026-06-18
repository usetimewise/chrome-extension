# Add Character To Scene Prompt Template

Use for scenes with two or more existing characters.

```text
Character A: [name, character_id, version, precise visual description].
Preserve Character A's exact identity, facial structure, colors, proportions, outfit, accessories, and illustration style from Character A references.

Character B: [name, character_id, version, precise visual description].
Preserve Character B's exact identity, facial structure, colors, proportions, outfit, accessories, and illustration style from Character B references.

Do not merge their facial features, colors, clothing, accessories, silhouettes, or proportions.

Change only:
- shared scene: [environment]
- Character A action and expression: [details]
- Character B action and expression: [details]
- interaction: [simple interaction first]

Keep unchanged:
- Character A invariants from its Character Pack
- Character B invariants from its Character Pack
- each character's independent color palette
- each character's independent outfit and accessories

Composition:
- place Character A [left/right/center/foreground/background]
- place Character B [left/right/center/foreground/background]
- [shot type]
- [camera angle]
- clear separation between silhouettes

Lighting and style:
- [lighting]
- [rendering style]
- preserve both characters' original visual style
```

Start with a simple joint composition before adding complex interaction.
