import json
import httpx
import time
import re

import os

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL", "")
ANON_KEY = (
    os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")
    or os.environ.get("SUPABASE_ANON_KEY", "")
)

if not SUPABASE_URL or not ANON_KEY:
    raise SystemExit(
        "Hata: VITE_SUPABASE_URL ve VITE_SUPABASE_PUBLISHABLE_KEY "
        "ortam değişkenleri ayarlanmalı (.env.local dosyasını kaynak gösterin)."
    )

HEADERS = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json",
}


def normalize_title(title):
    t = title.lower()
    t = re.sub(r"[^a-z\u00e7\u011f\u0131\u00f6\u015f\u00fc0-9\s]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def extract_core_topic(title):
    t = title.lower()
    t = re.sub(r"\([^)]*\)", "", t)
    t = re.sub(
        r"\br\u00fcyada\b|\br\u00fcya\b|\bg\u00f6rmek\b|\bgormek\b|\bne\s*demek\b|\bne\s*anlama\s*gelir\b",
        " ",
        t,
    )
    t = re.sub(r"[^a-z\u00e7\u011f\u0131\u00f6\u015f\u00fc0-9\s]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def extract_core_words(title):
    core = extract_core_topic(title)
    words = [w for w in core.split() if len(w) > 1]
    return set(words)


def generate_slug(title):
    slug = title.lower()
    slug = slug.replace("\u011f", "g").replace("\u00fc", "u").replace("\u015f", "s")
    slug = slug.replace("\u0131", "i").replace("\u00f6", "o").replace("\u00e7", "c")
    slug = re.sub(r"[^a-z0-9]+", "-", slug).strip("-")
    return slug


def fetch_all_dreams():
    all_dreams = []
    page = 0
    page_size = 1000

    while True:
        from_row = page * page_size
        to_row = from_row + page_size - 1

        url = f"{SUPABASE_URL}/rest/v1/dreams?select=id,title,slug,content&order=created_at"

        r = httpx.get(
            url,
            headers={
                **HEADERS,
                "Range": f"{from_row}-{to_row}",
                "Prefer": "count=exact",
            },
            timeout=30,
        )

        if r.status_code not in (200, 206):
            print(f"Error fetching page {page}: {r.status_code} {r.text[:200]}")
            break

        data = r.json()
        if not data:
            break

        all_dreams.extend(data)
        print(f"  Page {page + 1}: got {len(data)} dreams (total: {len(all_dreams)})")

        if len(data) < page_size:
            break

        page += 1
        time.sleep(0.3)

    return all_dreams


print("=== PHASE 1: Fetch existing dreams from Supabase ===")
existing = fetch_all_dreams()
print(f"Total existing dreams: {len(existing)}")

with open("existing_dreams.json", "w", encoding="utf-8") as f:
    json.dump(existing, f, ensure_ascii=False, indent=2)

print("\n=== PHASE 2: Build lookup indices ===")

existing_by_core = {}
existing_by_slug = {}
existing_norm_titles = {}

for d in existing:
    nt = normalize_title(d["title"])
    existing_norm_titles[nt] = d
    existing_by_slug[d["slug"]] = d

    core_words = extract_core_words(d["title"])
    key = " ".join(sorted(core_words))
    if key not in existing_by_core:
        existing_by_core[key] = []
    existing_by_core[key].append(d)

print(f"Built {len(existing_by_core)} core word groups")

print("\n=== PHASE 3: Read Word dreams ===")
with open("word_dreams.json", "r", encoding="utf-8") as f:
    word_dreams = json.load(f)

word_dreams = word_dreams[2:]
print(f"Word dreams (after skipping metadata): {len(word_dreams)}")

print("\n=== PHASE 4: Smart Matching ===")
to_add = []
to_update = []
fuzzy_matched = 0
exact_matched = 0

for i, wd in enumerate(word_dreams):
    if (i + 1) % 200 == 0:
        print(f"  Processing {i + 1}/{len(word_dreams)}...")

    nt = normalize_title(wd["title"])

    matched_dream = None
    match_type = None

    # Method 1: Exact normalized title match
    if nt in existing_norm_titles:
        matched_dream = existing_norm_titles[nt]
        match_type = "exact_title"

    # Method 2: Core word match
    if not matched_dream:
        word_core = extract_core_words(wd["title"])
        word_core_key = " ".join(sorted(word_core))

        if word_core_key in existing_by_core:
            candidates = existing_by_core[word_core_key]
            if len(candidates) == 1:
                matched_dream = candidates[0]
                match_type = "core_words_exact"
            else:
                # Among multiple candidates, pick the one with the shortest title
                # (the simplest core match is usually correct)
                candidates.sort(key=lambda x: len(x["title"]))
                matched_dream = candidates[0]
                match_type = "core_words_fuzzy"

    # Method 3: Check if word title words are subset of DB title words
    if not matched_dream:
        word_core = extract_core_words(wd["title"])
        if len(word_core) >= 2:
            for d in existing:
                db_core = extract_core_words(d["title"])
                if word_core.issubset(db_core) or db_core.issubset(word_core):
                    matched_dream = d
                    match_type = "subset_match"
                    break

    if matched_dream:
        fuzzy_matched += 1 if match_type != "exact_title" else 0
        exact_matched += 1 if match_type == "exact_title" else 0
        to_update.append(
            {
                "word_title": wd["title"],
                "word_content": wd["content"],
                "existing_id": matched_dream["id"],
                "existing_title": matched_dream["title"],
                "existing_slug": matched_dream["slug"],
                "match_type": match_type,
            }
        )
    else:
        to_add.append(wd)

print(f"\n=== COMPARISON RESULTS ===")
print(f"Total in Word: {len(word_dreams)}")
print(f"Exact title matches: {exact_matched}")
print(f"Fuzzy matches: {fuzzy_matched}")
print(f"Total matched: {exact_matched + fuzzy_matched}")
print(f"To ADD (Word only, no match found): {len(to_add)}")
print(f"To UPDATE (matched): {len(to_update)}")

with open("compare_results.json", "w", encoding="utf-8") as f:
    json.dump(
        {
            "to_add": [{"title": d["title"], "content": d["content"]} for d in to_add],
            "to_update": [
                {
                    "word_title": u["word_title"],
                    "word_content": u["word_content"],
                    "existing_id": u["existing_id"],
                    "existing_title": u["existing_title"],
                    "existing_slug": u["existing_slug"],
                    "match_type": u["match_type"],
                }
                for u in to_update
            ],
        },
        f,
        ensure_ascii=False,
        indent=2,
    )

print(f"\n=== TO ADD ({len(to_add)} dreams) ===")
for d in to_add:
    print(f"  + {d['title']}")

print(f"\n=== TO UPDATE (first 30) ===")
for u in to_update[:30]:
    print(f"  ~ '{u['word_title']}' -> '{u['existing_title']}' [{u['match_type']}]")
if len(to_update) > 30:
    print(f"  ... and {len(to_update) - 30} more")
