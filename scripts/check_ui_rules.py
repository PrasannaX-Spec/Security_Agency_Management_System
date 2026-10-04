#!/usr/bin/env python3
"""Scan web, mobile and legal-text sources for violations of PRD section 17.

Usage:
    python3 scripts/check_ui_rules.py            # scans the default folders
    python3 scripts/check_ui_rules.py web/src    # scans only what you pass

Levels:
    FAIL    a rule is broken; the script exits with code 1
    REVIEW  possible problem; a human decides (for example a circular avatar)

Standard library only, works on Windows, macOS and Linux.
"""
import re
import sys
from pathlib import Path

DEFAULT_TARGETS = [
    "web/src", "web/index.html",
    "mobile/src", "mobile/App.js", "mobile/App.tsx", "mobile/app.json",
    "backend/apps/legal",
]
SKIP_DIRS = {"node_modules", ".git", "dist", "build", ".expo", "__pycache__", "migrations"}
TEXT_EXT = {".js", ".jsx", ".ts", ".tsx", ".css", ".html", ".json", ".py", ".md", ".txt"}

AI_NAMES = "ai|claude|chatgpt|gpt|openai|anthropic|lovable|bolt|v0|cursor"

CHECKS = [
    ("Em dash or en dash in text", r"[\u2013\u2014]", "FAIL"),
    ("Emoji or dingbat symbol (use the icon library)",
     "[\U0001F000-\U0001FAFF\u2600-\u27BF\uFE0F]", "FAIL"),
    ("Exclamation mark in user-facing text",
     r"""(?<!!)!(?!=)(?!important)(?!\s*\[)""", "REVIEW"),
    ("Gradient or purple-family color", r"gradient|purple|violet|fuchsia|indigo", "FAIL"),
    ("AI or site-builder tag",
     rf"made with ({AI_NAMES})|built with ({AI_NAMES})|(generated|created|powered) (by|with) ({AI_NAMES})"
     r"|lovable\.dev|bolt\.new|v0\.dev|name=[\"']generator[\"']", "FAIL"),
    ("Template or placeholder text",
     r"lorem ipsum|\bTODO\b|\[(your|agency|company)[^\]]*\]|vite \+ react|test hmr|edit <code>", "FAIL"),
    ("Possible pill-shaped element (fine for avatars and dots, not for buttons)",
     r"rounded-full|border-?radius\W+(9999|999|50%)", "REVIEW"),
    ("Filler marketing words",
     r"seamless|revolution|cutting-edge|empower|unlock|leverage|next-gen|supercharge|game-chang", "REVIEW"),
    ("Cursor effects or scroll animation",
     r"cursor:\s*url|mousemove|IntersectionObserver|parallax|framer-motion|\bgsap\b|\baos\b"
     r"|scroll-timeline|animation-timeline|ScrollTrigger", "REVIEW"),
]
COMPILED = [(n, re.compile(p, re.I), lvl) for n, p, lvl in CHECKS]


def iter_files(targets):
    for t in targets:
        p = Path(t)
        if p.is_file():
            yield p
        elif p.is_dir():
            for f in p.rglob("*"):
                if f.is_file() and f.suffix.lower() in TEXT_EXT \
                        and not (set(f.parts) & SKIP_DIRS):
                    yield f


def main():
    targets = sys.argv[1:] or DEFAULT_TARGETS
    existing = [t for t in targets if Path(t).exists()]
    if not existing:
        print("Nothing to scan. Run from the repo root or pass folders as arguments.")
        return 2

    hits = {name: [] for name, _, _ in COMPILED}
    scanned = 0
    for f in iter_files(existing):
        scanned += 1
        try:
            lines = f.read_text(encoding="utf-8", errors="ignore").splitlines()
        except OSError:
            continue
        for no, line in enumerate(lines, 1):
            for name, rx, _ in COMPILED:
                if rx.search(line):
                    hits[name].append(f"{f}:{no}: {line.strip()[:100]}")

    failed = False
    for name, _, level in COMPILED:
        found = hits[name]
        if not found:
            print(f"ok      {name}")
            continue
        print(f"{level:<7} {name} ({len(found)})")
        for h in found[:20]:
            print(f"          {h}")
        if len(found) > 20:
            print(f"          ...and {len(found) - 20} more")
        if level == "FAIL":
            failed = True

    print(f"\nScanned {scanned} files.")
    print("Result: FAIL, fix the FAIL items above." if failed
          else "Result: no FAIL items. Review any REVIEW items by hand.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
