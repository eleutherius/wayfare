#!/usr/bin/env python3
"""
Google "Збережені місця" GeoJSON → Wayfare place markdown files.

Usage:
    python scripts/saved_places_to_md.py "Збережені місця.json"

Skips entries without a name or geometry, and files that already exist.
Sets category="other" — edit each file to correct it.
"""

import json
import re
import sys
import unicodedata
from pathlib import Path

CYRILLIC = {
    "а":"a","б":"b","в":"v","г":"h","ґ":"g","д":"d","е":"e","є":"ie",
    "ж":"zh","з":"z","и":"y","і":"i","ї":"i","й":"i","к":"k","л":"l",
    "м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u",
    "ф":"f","х":"kh","ц":"ts","ч":"ch","ш":"sh","щ":"shch","ь":"",
    "ю":"iu","я":"ia",
    # Russian extras
    "э":"e","ё":"io","ъ":"","ы":"y",
}

REGION_RE = re.compile(r"oblast|область|провінц|province|county|region|район", re.I)
POSTAL_RE = re.compile(r"^\d{4,}$|^\d{2}-\d{3}$")
LEADING_POSTAL_RE = re.compile(r"^\d[\d\-]{2,}\s+")
UK_POSTCODE_RE = re.compile(r"\s+[A-Z]{1,2}\d+\s+\d[A-Z]{2}$", re.I)
STATE_CODE_RE = re.compile(r"\s+[A-Z]{1,2}$")


def slugify(name: str) -> str:
    s = name.lower()
    s = "".join(CYRILLIC.get(c, c) for c in s)
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")
    return s[:60]


def extract_city(address: str | None) -> str:
    if not address:
        return "TODO"
    parts = [p.strip() for p in address.split(",") if p.strip()]

    found_country = False
    for part in reversed(parts):
        if POSTAL_RE.match(part):
            continue
        if REGION_RE.search(part):
            continue
        if not found_country:
            found_country = True
            continue

        cleaned = LEADING_POSTAL_RE.sub("", part)
        cleaned = UK_POSTCODE_RE.sub("", cleaned)
        cleaned = STATE_CODE_RE.sub("", cleaned).strip()
        if len(cleaned) > 1:
            return cleaned

    return "TODO"


def main() -> None:
    if len(sys.argv) < 2:
        print('Usage: python scripts/saved_places_to_md.py "Збережені місця.json"', file=sys.stderr)
        sys.exit(1)

    input_path = Path(sys.argv[1]).resolve()
    data = json.loads(input_path.read_text(encoding="utf-8"))

    out_dir = input_path.parent / "src" / "content" / "places"
    out_dir.mkdir(parents=True, exist_ok=True)

    created = skipped = 0

    for feature in data["features"]:
        loc = (feature.get("properties") or {}).get("location") or {}
        name = loc.get("name")

        if not name or not feature.get("geometry"):
            skipped += 1
            continue

        lng, lat = feature["geometry"]["coordinates"]
        raw_date = (feature.get("properties") or {}).get("date", "")
        date = raw_date[:10] if raw_date else "TODO"
        city = extract_city(loc.get("address"))
        google_url = (feature.get("properties") or {}).get("google_maps_url", "")

        slug = slugify(name)
        if not slug:
            print(f'  skip (no slug): "{name}"')
            skipped += 1
            continue

        file_path = out_dir / f"{slug}.md"
        if file_path.exists():
            print(f"  skip (exists): {slug}.md")
            skipped += 1
            continue

        google_line = f"# google_maps_url: {google_url}\n" if google_url else ""
        content = (
            f'---\n'
            f'title: "{name.replace(chr(34), chr(92)+chr(34))}"\n'
            f'lat: {lat}\n'
            f'lng: {lng}\n'
            f'category: other\n'
            f'city: {city}\n'
            f'date: {date}\n'
            f'---\n\n'
            f'{google_line}\n'
        )

        file_path.write_text(content, encoding="utf-8")
        print(f"  ✓ {slug}.md  (city: {city})")
        created += 1

    print(f"\nDone: {created} created, {skipped} skipped.")


if __name__ == "__main__":
    main()
