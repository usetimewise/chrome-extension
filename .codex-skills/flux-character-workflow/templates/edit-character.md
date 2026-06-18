# Edit Character Prompt Template

Use for targeted edits to an existing generated image.

```text
In image 1, edit [Character name and precise visual description].

Preserve the exact character identity, facial structure, skin or fur tone,
eye shape and color, hairstyle or fur silhouette, body proportions,
outfit design, accessories, and illustration style from the reference image.

Change only:
- [specific local change 1]
- [specific local change 2]

Keep unchanged:
- face and head shape
- skin/fur/surface tone and HEX palette
- eyes
- hair/fur/head silhouette
- body proportions
- outfit details not listed above
- background areas not listed above
- line style and lighting unless explicitly changed

Composition:
- keep the existing framing unless requested otherwise
- keep the existing camera angle unless requested otherwise

Lighting and style:
- match the source image lighting
- match the source image rendering style
```

For complex edits, split into steps: background, pose, expression, props, final correction.
