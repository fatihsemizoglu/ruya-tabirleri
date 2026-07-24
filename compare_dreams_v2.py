import json
import time
import re
import httpx

SUPABASE_URL = "https://dagjpitlouekbnwdcpbz.supabase.co"
ANON_KEY = "sb_publishable_mv5vMs5QEH0i7wUfqTz_WQ_3FN6toYg"

HEADERS = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json",
}


def tr_to_ascii(text):
    """Convert Turkish characters to ASCII equivalents for comparison."""
    text = text.replace("\u0131", "i")  # dotless ı
    text = text.replace("\u0130", "i")  # dotted İ
    text = text.replace("\u011f", "g")  # ğ
    text = text.replace("\u011e", "g")  # Ğ
    text = text.replace("\u00fc", "u")  # ü
    text = text.replace("\u00dc", "u")  # Ü
    text = text.replace("\u015f", "s")  # ş
    text = text.replace("\u015e", "s")  # Ş
    text = text.replace("\u00f6", "o")  # ö
    text = text.replace("\u00d6", "o")  # Ö
    text = text.replace("\u00e7", "c")  # ç
    text = text.replace("\u00c7", "c")  # Ç
    text = text.replace("\u00ee", "i")  # î
    text = text.replace("\u00ae", "")  # ®
    return text


def normalize_for_compare(title):
    """Normalize a title for comparison by converting to lowercase ASCII."""
    t = title.lower()
    t = tr_to_ascii(t)
    t = re.sub(r"\([^)]*\)", "", t)
    t = re.sub(
        r"\bruyada\b|\bruya\b|\bgormek\b|\bgordugunu\b|\bne demek\b|\bne anlama gelir\b|\bgormek nedir\b",
        " ",
        t,
    )
    t = re.sub(r"[^a-z0-9\s]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def get_core_words(title):
    """Get the set of meaningful core words from a title."""
    normalized = normalize_for_compare(title)
    words = [w for w in normalized.split() if len(w) > 1]
    return set(words)


def slugify(title):
    """Generate slug matching the project's generateSlug function."""
    slug = title.lower()
    slug = tr_to_ascii(slug)
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
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
            print(f"Error fetching page {page}: {r.status_code}")
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


print("=== PHASE 1: Fetch existing dreams ===")
existing = fetch_all_dreams()
print(f"Total: {len(existing)}")

with open("existing_dreams.json", "w", encoding="utf-8") as f:
    json.dump(existing, f, ensure_ascii=False, indent=2)

print("\n=== PHASE 2: Build indices ===")
db_by_norm = {}
db_by_slug = {}
db_by_core = {}

for d in existing:
    norm = normalize_for_compare(d["title"])
    db_by_norm[norm] = d
    db_by_slug[d["slug"]] = d
    core = frozenset(get_core_words(d["title"]))
    if core not in db_by_core:
        db_by_core[core] = []
    db_by_core[core].append(d)

print(f"  Norm index: {len(db_by_norm)}")
print(f"  Slug index: {len(db_by_slug)}")
print(f"  Core index: {len(db_by_core)}")

print("\n=== PHASE 3: Read Word dreams ===")
with open("word_dreams.json", "r", encoding="utf-8") as f:
    word_dreams = json.load(f)
word_dreams = word_dreams[2:]
print(f"Word dreams: {len(word_dreams)}")

print("\n=== PHASE 4: Smart Matching ===")
to_add = []
to_update = []

for i, wd in enumerate(word_dreams):
    if (i + 1) % 200 == 0:
        print(f"  Processing {i + 1}/{len(word_dreams)}...")

    w_title = wd["title"]
    matched = None

    # Method 1: Normalized text match
    w_norm = normalize_for_compare(w_title)
    if w_norm in db_by_norm:
        matched = db_by_norm[w_norm]

    # Method 2: Slug match (check if word slug is a substring of any DB slug)
    if not matched:
        w_slug = slugify(w_title)
        if w_slug in db_by_slug:
            matched = db_by_slug[w_slug]

    # Method 3: Core words subset match
    if not matched:
        w_core = get_core_words(w_title)
        if len(w_core) >= 1:
            # Try to find a DB dream where one side's core is subset of the other
            for d in existing:
                d_core = get_core_words(d["title"])
                if w_core == d_core:
                    matched = d
                    break
                elif len(w_core) >= 2 and len(d_core) >= 2:
                    if w_core.issubset(d_core) or d_core.issubset(w_core):
                        matched = d
                        break

    # Method 4: Check if word's first core word appears in any DB normal form
    if not matched:
        w_core = get_core_words(w_title)
        if w_core:
            first_word = list(w_core)[0]
            for norm, d in db_by_norm.items():
                if first_word in norm.split():
                    matched = d
                    break

    if matched:
        to_update.append(
            {
                "word_title": w_title,
                "word_content": wd["content"],
                "existing_id": matched["id"],
                "existing_title": matched["title"],
                "existing_slug": matched["slug"],
            }
        )
    else:
        to_add.append(wd)

print(f"\n=== RESULTS ===")
print(f"To ADD: {len(to_add)}")
print(f"To UPDATE: {len(to_update)}")

# Save results
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
                }
                for u in to_update
            ],
        },
        f,
        ensure_ascii=False,
        indent=2,
    )

print(f"\n=== ADD LIST ({len(to_add)}) ===")
for d in to_add:
    print(f"  + {d['title']}")

print(f"\n=== UPDATE SAMPLE (first 20 of {len(to_update)}) ===")
for u in to_update[:20]:
    print(f"  ~ '{u['word_title']}' -> '{u['existing_title']}'")

if len(to_update) > 20:
    print(f"  ... and {len(to_update) - 20} more")
