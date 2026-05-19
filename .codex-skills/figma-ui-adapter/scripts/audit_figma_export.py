#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable


HOOK_RE = re.compile(r"\b(useState|useEffect|useReducer|useMemo|useCallback|useRef|useLayoutEffect)\b")
IMPORT_RE = re.compile(r"""from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]""")
MOCK_NAME_RE = re.compile(r"\b(mock|sample|demo|fake|dummy|todayData|topSites|categoryData|dailyTrend)\b", re.IGNORECASE)
ARRAY_LITERAL_RE = re.compile(r"const\s+\w+\s*[:=][^=\n]*=\s*\[", re.MULTILINE)
OBJECT_LITERAL_RE = re.compile(r"const\s+\w+\s*[:=][^=\n]*=\s*\{", re.MULTILINE)
CONSOLE_RE = re.compile(r"\bconsole\.(log|debug|info|warn|error)\b")
CLASSNAME_RE = re.compile(r'className\s*=\s*["\'][^"\']*(?:flex|grid|px-|py-|bg-|text-|rounded|border)[^"\']*["\']')
CSS_IMPORT_RE = re.compile(r"""import\s+['"][^'"]+\.css['"]""")
STRING_RE = re.compile(r"""['"]([^'"]+)['"]""")
DOMAIN_RE = re.compile(r"\b[a-z0-9-]+(?:\.[a-z0-9-]+)+\.[a-z]{2,}\b")


@dataclass
class FileReport:
    path: Path
    external_imports: set[str] = field(default_factory=set)
    hooks: set[str] = field(default_factory=set)
    has_mock_data: bool = False
    has_console: bool = False
    uses_tailwind_classes: bool = False
    css_imports: list[str] = field(default_factory=list)
    domain_examples: set[str] = field(default_factory=set)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Audit a Figma-exported React UI bundle before adaptation.")
    parser.add_argument("--figma-root", required=True, type=Path)
    parser.add_argument("--target-root", required=True, type=Path)
    parser.add_argument("--entry", action="append", default=[], help="Entry file path relative to --figma-root")
    return parser.parse_args()


def load_package_json(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"Missing package.json: {path}")
    return json.loads(path.read_text())


def external_package(specifier: str) -> str | None:
    if specifier.startswith(".") or specifier.startswith("/") or specifier.startswith("@/") or ":" in specifier:
        return None
    if specifier.startswith("@"):
        parts = specifier.split("/")
        return "/".join(parts[:2]) if len(parts) > 1 else specifier
    return specifier.split("/")[0]


def scan_file(path: Path) -> FileReport:
    text = path.read_text()
    report = FileReport(path=path)

    for match in IMPORT_RE.finditer(text):
        specifier = match.group(1) or match.group(2)
        pkg = external_package(specifier)
        if pkg:
            report.external_imports.add(pkg)

    report.hooks = set(HOOK_RE.findall(text))
    report.has_mock_data = bool(
        MOCK_NAME_RE.search(text)
        or ARRAY_LITERAL_RE.search(text)
        or (OBJECT_LITERAL_RE.search(text) and len(DOMAIN_RE.findall(text)) >= 2)
    )
    report.has_console = bool(CONSOLE_RE.search(text))
    report.uses_tailwind_classes = bool(CLASSNAME_RE.search(text))
    report.css_imports = CSS_IMPORT_RE.findall(text)
    report.domain_examples = {
        value for literal in STRING_RE.findall(text) for value in DOMAIN_RE.findall(literal)
    }
    return report


def gather_files(figma_root: Path, entries: list[str]) -> list[Path]:
    if entries:
        return [figma_root / entry for entry in entries]
    return sorted(
        path for path in figma_root.rglob("*")
        if path.suffix in {".ts", ".tsx", ".js", ".jsx"} and path.is_file()
    )


def package_set(package_json: dict) -> set[str]:
    packages: set[str] = set()
    for key in ("dependencies", "devDependencies", "peerDependencies"):
        packages.update((package_json.get(key) or {}).keys())
    return packages


def recommend_mode(reports: Iterable[FileReport], missing_packages: set[str]) -> str:
    report_list = list(reports)
    if missing_packages:
        return "presentation-only"
    if any(report.hooks or report.has_mock_data for report in report_list):
        return "presentation-only"
    return "leaf-component transplant candidate"


def summarize_findings(reports: list[FileReport]) -> tuple[list[str], list[str], list[str]]:
    stateful = [str(report.path) for report in reports if report.hooks]
    mocky = [str(report.path) for report in reports if report.has_mock_data]
    css_coupled = [str(report.path) for report in reports if report.css_imports or report.uses_tailwind_classes]
    return stateful, mocky, css_coupled


def bullet_list(items: Iterable[str], empty: str = "None") -> str:
    item_list = list(items)
    if not item_list:
        return f"- {empty}"
    return "\n".join(f"- `{item}`" for item in item_list)


def main() -> int:
    args = parse_args()
    figma_root = args.figma_root.resolve()
    target_root = args.target_root.resolve()

    figma_package = load_package_json(figma_root / "package.json")
    target_package = load_package_json(target_root / "package.json")

    files = gather_files(figma_root, args.entry)
    reports = [scan_file(path) for path in files if path.exists()]

    figma_packages = package_set(figma_package)
    target_packages = package_set(target_package)
    missing_packages = sorted(figma_packages - target_packages)

    all_external_imports = sorted({pkg for report in reports for pkg in report.external_imports})
    unsupported_imports = sorted({pkg for pkg in all_external_imports if pkg not in target_packages})
    stateful, mocky, css_coupled = summarize_findings(reports)
    console_files = [str(report.path) for report in reports if report.has_console]
    domains = sorted({domain for report in reports for domain in report.domain_examples})
    mode = recommend_mode(reports, set(missing_packages) | set(unsupported_imports))

    print("# Figma Export Audit")
    print()
    print(f"- Figma root: `{figma_root}`")
    print(f"- Target root: `{target_root}`")
    print(f"- Files scanned: `{len(reports)}`")
    print(f"- Recommended transfer mode: `{mode}`")
    print()
    print("## Dependency delta")
    print()
    print("### Packages declared by the export but missing in the target")
    print(bullet_list(missing_packages))
    print()
    print("### External packages imported by scanned files but missing in the target")
    print(bullet_list(unsupported_imports))
    print()
    print("## Risk signals")
    print()
    print("### Stateful files")
    print(bullet_list(stateful))
    print()
    print("### Files with mock-data signals")
    print(bullet_list(mocky))
    print()
    print("### Files coupled to global CSS or utility-class styling")
    print(bullet_list(css_coupled))
    print()
    print("### Files with console usage")
    print(bullet_list(console_files))
    print()
    print("### Hardcoded domain-like strings")
    print(bullet_list(domains, empty="None detected"))
    print()
    print("## Suggested next step")
    print()
    if mode == "presentation-only":
        print("- Reuse the export as a presentation donor only.")
        print("- Keep target-side state, bootstrap hooks, messaging, and data types.")
        print("- Copy markup, CSS intent, and small stateless fragments after review.")
    else:
        print("- Small stateless components may be transplanted after review.")
        print("- Still prefer target-side data and integration boundaries.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
