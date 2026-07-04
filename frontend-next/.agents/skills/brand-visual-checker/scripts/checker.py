#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import json
import os
import re
import sys


def find_files(dir_path):
    """Finds all TSX and TS files recursively."""
    matched_files = []
    for root, _, files in os.walk(dir_path):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                matched_files.append(os.path.join(root, file))
    return matched_files


def scan_file(file_path):
    """Scans a file for typos and contrast issues."""
    violations = []
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        # 1. Check for slate-50mber typo
        typos = re.findall(r'slate-50mber', content)
        if typos:
            violations.append({
                'type': 'typo',
                'description': f'Found {len(typos)} occurrences of legacy "slate-50mber" typo.',
                'matches': ['slate-50mber'] * len(typos)
            })

        # 2. Check for contrast issues (text-navy or text-slate-900 on dark backdrops)
        has_dark_bg = any(bg in content for bg in ['bg-[#020811]', 'bg-[#04101f]', 'bg-black', 'bg-navy', 'bg-[#07192e]'])
        if has_dark_bg:
            # Look for text-navy or text-slate-900
            contrast_tokens = re.findall(r'text-navy|text-slate-900', content)
            if contrast_tokens:
                violations.append({
                    'type': 'contrast',
                    'description': f'Found dark text tokens {list(set(contrast_tokens))} on a dark background file.',
                    'matches': contrast_tokens
                })

    except Exception as e:
        print(f"Error scanning {file_path}: {e}", file=sys.stderr)

    return violations


def fix_file(file_path):
    """Fixes typos and contrast issues in a file."""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        original = content
        changes = []

        # 1. Fix typos
        if 'slate-50mber' in content:
            content = content.replace('slate-50mber', 'amber')
            changes.append("Fixed slate-50mber typo -> amber")

        # 2. Fix contrast issues (only on dark backgrounds, excluding button exceptions)
        has_dark_bg = any(bg in content for bg in ['bg-[#020811]', 'bg-[#04101f]', 'bg-black', 'bg-navy', 'bg-[#07192e]'])
        if has_dark_bg:
            # We want to replace text-navy, but be careful not to replace it if it's on an orange/gold gradient button
            # Let's find matches and replace safely
            lines = content.split('\n')
            new_lines = []
            for line in lines:
                if 'text-navy' in line:
                    # If it's a gold/amber button, keep text-navy
                    if 'from-ember' in line or 'from-amber' in line or 'bg-white' in line or 'bg-gradient' in line:
                        new_lines.append(line)
                    else:
                        line = line.replace('text-navy', 'text-white')
                        changes.append("Corrected text-navy to text-white for dark backdrop contrast")
                        new_lines.append(line)
                else:
                    new_lines.append(line)
            content = '\n'.join(new_lines)

        if content != original:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return changes

    except Exception as e:
        print(f"Error fixing {file_path}: {e}", file=sys.stderr)

    return []


def main():
    parser = argparse.ArgumentParser(description='Brand visual style and typo enforcement tool.')
    subparsers = parser.add_subparsers(dest='command', required=True)

    scan_parser = subparsers.add_parser('scan', help='Scan path for branding issues')
    scan_parser.add_argument('--path', required=True, help='Directory path to scan')
    scan_parser.add_argument('--output', required=True, help='Output JSON report path')

    fix_parser = subparsers.add_parser('fix', help='Automatically fix branding issues')
    fix_parser.add_argument('--path', required=True, help='Directory path to fix')
    fix_parser.add_argument('--output', required=True, help='Output JSON report path')

    args = parser.parse_args()

    files = find_files(args.path)
    report = {}

    if args.command == 'scan':
        print(f"Scanning {len(files)} files in {args.path}...")
        for file in files:
            violations = scan_file(file)
            if violations:
                report[os.path.relpath(file, args.path)] = violations
        
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2)
        print(f"Scan complete! Found issues in {len(report)} files. Report written to {args.output}")

    elif args.command == 'fix':
        print(f"Fixing files in {args.path}...")
        fixed_count = 0
        for file in files:
            changes = fix_file(file)
            if changes:
                report[os.path.relpath(file, args.path)] = changes
                fixed_count += 1
        
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2)
        print(f"Fix complete! Restored style properties in {fixed_count} files. Report written to {args.output}")


if __name__ == '__main__':
    main()
