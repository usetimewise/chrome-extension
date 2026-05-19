#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from pathlib import Path


FRONTMATTER_RE = re.compile(r"\A---\n(.*?)\n---\n", re.DOTALL)
FIELD_RE = re.compile(r"^(name|description):\s*(.+)$", re.MULTILINE)
NAME_RE = re.compile(r"^[a-z0-9-]{1,64}$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate the figma-ui-adapter skill without external dependencies.")
    parser.add_argument("skill_dir", type=Path)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    skill_dir = args.skill_dir.resolve()
    skill_file = skill_dir / "SKILL.md"
    agents_file = skill_dir / "agents" / "openai.yaml"

    if not skill_file.exists():
        raise SystemExit(f"Missing SKILL.md: {skill_file}")

    text = skill_file.read_text()
    frontmatter_match = FRONTMATTER_RE.match(text)
    if not frontmatter_match:
        raise SystemExit("SKILL.md is missing YAML frontmatter delimiters.")

    fields = dict(FIELD_RE.findall(frontmatter_match.group(1)))
    name = fields.get("name", "").strip()
    description = fields.get("description", "").strip()

    if not NAME_RE.fullmatch(name):
        raise SystemExit(f"Invalid skill name: {name!r}")
    if name != skill_dir.name:
        raise SystemExit(f"Skill folder name {skill_dir.name!r} does not match frontmatter name {name!r}")
    if not description:
        raise SystemExit("Description is required.")
    if len(description) < 40:
        raise SystemExit("Description is too short to trigger reliably.")
    if not agents_file.exists():
        raise SystemExit(f"Missing agents/openai.yaml: {agents_file}")

    print("Skill validation passed.")
    print(f"- skill_dir: {skill_dir}")
    print(f"- name: {name}")
    print(f"- description_length: {len(description)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
