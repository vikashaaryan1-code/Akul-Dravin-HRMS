---
name: brand-visual-checker
description: >-
  Audits the workspace frontend codebase to verify color token consistency,
  identify contrast issues (e.g. text-navy on dark backgrounds), find color typos
  (e.g. slate-50mber), and automatically correct them.
---

# Brand Visual Checker

## Overview
This skill provides automated auditing and resolution utilities to enforce the "Premium Dark Navy 3D Glass" brand theme. It automatically scans TypeScript and CSS files for:
- Invalid/corrupt Tailwind color class typos (such as `slate-50mber`).
- Contrast vulnerabilities, specifically dark typography tokens (`text-navy`, `text-slate-900`) being used inside dark containers or page roots.

## Quick Start
To scan the `src/` directory for any brand violations:
```bash
uv run .agents/skills/brand-visual-checker/scripts/checker.py scan --path ./src --output violations.json
```

To automatically resolve all issues:
```bash
uv run .agents/skills/brand-visual-checker/scripts/checker.py fix --path ./src --output results.json
```

## Utility Scripts

### checker.py
A Python CLI utility that parses files recursively to find brand styling violations.

**Commands:**
- `scan`:
  - `--path`: Clean directory path to scan (required).
  - `--output`: Path to write the JSON findings report (required).
- `fix`:
  - `--path`: Clean directory path to fix (required).
  - `--output`: Path to write the JSON results report (required).

## Rate Limiting
Not applicable (local filesystem only).

## Common Mistakes
- **Running in wrong directory:** Always run from the project root (`frontend-next/`).
- **Ignoring custom components:** If you add new layout files with custom background classes, ensure the background matches the `void` navy theme or the script may flag correct white texts.
