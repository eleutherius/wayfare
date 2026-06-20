#!/usr/bin/env python3
"""
Google Maps links → Wayfare place markdown files.

Usage:
    python scripts/gmaps_links_to_md.py links.txt
    python scripts/gmaps_links_to_md.py links.txt --city Bangkok

The text file should contain one Google Maps link per line:
    https://maps.app.goo.gl/afqACNWLo31sAMhq7
    https://www.google.com/maps/place/...

Skips files that already exist.
Sets category="other" — edit each file to correct it.
"""

import http.client
import re
import sys
import time
import unicodedata
from pathlib import Path
from urllib.parse import urlparse, unquote

# ── Cyrillic transliteration ──────────────────────────────────────────────────
CYRILLIC = {
    "а":"a","б":"b","в":"v","г":"h","ґ":"g","д":"d","е":"e","є":"ie",
    "ж":"zh","з":"z","и":"y","і":"i","ї":"i","й":"i","к":"k","л":"l",
    "м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u",
    "ф":"f","х":"kh","ц":"ts","ч":"ch","ш":"sh","щ":"shch","ь":"",
    "ю":"iu","я":"ia","э":"e","ё":"io","ъ":"","ы":"y",
}

def slugify(name: str) -> str:
    s = name.lower()
    s = "".join(CYRILLIC.get(c, c) for c in s)
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")[:60]

# ── URL resolution ────────────────────────────────────────────────────────────
HEADERS = {"User-Agent": "Mozilla/5.0"}

def resolve_url(url: str, max_hops: int = 5) -> str:
    """Follow redirects until a non-redirect or max hops is reached."""
    for _ in range(max_hops):
        parsed = urlparse(url)
        path = parsed.path + (f"?{parsed.query}" if parsed.query else "")
        try:
            conn = http.client.HTTPSConnection(parsed.netloc, timeout=15)
            conn.request("HEAD", path, headers=HEADERS)
            resp = conn.getresponse()
            location = resp.getheader("location", "")
            conn.close()
            if resp.status in (301, 302, 303, 307, 308) and location:
                url = location
                continue
            return url
        except Exception as e:
            print(f"    warning: {e}")
            return url
    return url

# ── Google Maps URL parsing ───────────────────────────────────────────────────
def parse_maps_url(url: str) -> dict:
    """Extract name and lat/lng from a resolved Google Maps URL."""
    info: dict = {}

    # Place name from /maps/place/NAME/
    m = re.search(r"/maps/place/([^/@?]+)", url)
    if m:
        info["name"] = unquote(m.group(1).replace("+", " ")).strip()

    # Prefer !3d/!4d (actual place coords) over @ (viewport center)
    m3d = re.search(r"!3d(-?\d+\.\d+)", url)
    m4d = re.search(r"!4d(-?\d+\.\d+)", url)
    if m3d and m4d:
        info["lat"] = float(m3d.group(1))
        info["lng"] = float(m4d.group(1))
    else:
        m = re.search(r"@(-?\d+\.\d+),(-?\d+\.\d+)", url)
        if m:
            info["lat"] = float(m.group(1))
            info["lng"] = float(m.group(2))

    # CID → prefer cleaner ?cid= link
    m = re.search(r"[?&]cid=(\d+)", url)
    if m:
        info["cid_url"] = f"http://maps.google.com/?cid={m.group(1)}"

    return info

# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    args = sys.argv[1:]
    if not args:
        print("Usage: python scripts/gmaps_links_to_md.py links.txt [--city Bangkok]")
        sys.exit(1)

    input_path = Path(args[0])
    if not input_path.exists():
        print(f"File not found: {input_path}")
        sys.exit(1)

    default_city = "TODO"
    if "--city" in args:
        idx = args.index("--city")
        if idx + 1 < len(args):
            default_city = args[idx + 1]

    urls = [
        line.strip()
        for line in input_path.read_text(encoding="utf-8").splitlines()
        if line.strip().startswith("http")
    ]

    if not urls:
        print("No URLs found in file.")
        sys.exit(0)

    # Output directory relative to the script location
    out_dir = Path(__file__).parent.parent / "src" / "content" / "places"
    out_dir.mkdir(parents=True, exist_ok=True)

    created = skipped = failed = 0

    for raw_url in urls:
        print(f"\n→ {raw_url}")

        # Resolve short link
        final_url = resolve_url(raw_url)
        if final_url != raw_url:
            print(f"  resolved: {final_url}")

        info = parse_maps_url(final_url)
        name = info.get("name", "")
        lat  = info.get("lat")
        lng  = info.get("lng")

        if not name or lat is None or lng is None:
            print("  SKIP — could not extract name or coordinates")
            failed += 1
            continue

        slug = slugify(name)
        if not slug:
            print(f"  SKIP — empty slug for '{name}'")
            failed += 1
            continue

        file_path = out_dir / f"{slug}.md"
        if file_path.exists():
            print(f"  skip (exists): {slug}.md")
            skipped += 1
            continue

        # Prefer CID URL; fall back to the short link itself
        google_maps_url = info.get("cid_url") or raw_url

        content = (
            f'---\n'
            f'title: "{name.replace(chr(34), chr(92) + chr(34))}"\n'
            f'lat: {lat}\n'
            f'lng: {lng}\n'
            f'category: other\n'
            f'city: {default_city}\n'
            f'date: {time.strftime("%Y-%m-%d")}\n'
            f'google_maps_url: "{google_maps_url}"\n'
            f'---\n\n'
        )

        file_path.write_text(content, encoding="utf-8")
        print(f"  ✓ {slug}.md  [{lat}, {lng}]")
        created += 1

        time.sleep(0.4)  # polite delay between requests

    print(f"\nDone: {created} created, {skipped} skipped, {failed} failed.")


if __name__ == "__main__":
    main()
