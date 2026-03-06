from __future__ import annotations

import re
from typing import Iterable


EMAIL_RE = re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')
PHONE_RE = re.compile(r'(?:\+\d{1,3}\s?)?(?:\d[\s-]?){10,13}')


def extract_email(text: str) -> str | None:
    match = EMAIL_RE.search(text)
    return match.group(0) if match else None


def extract_phone(text: str) -> str | None:
    match = PHONE_RE.search(text)
    if not match:
        return None
    return re.sub(r'\s+', ' ', match.group(0)).strip()


def normalize_skill_set(skills: Iterable[str]) -> list[str]:
    normalized = {skill.strip().lower() for skill in skills if skill and skill.strip()}
    return sorted(normalized)


def tokenize(text: str) -> list[str]:
    return [token.lower() for token in re.findall(r'[A-Za-z0-9+#.-]+', text)]


def sentence_count(text: str) -> int:
    return len([part for part in re.split(r'[.!?]+', text) if part.strip()])
