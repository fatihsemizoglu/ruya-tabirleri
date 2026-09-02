#!/usr/bin/env python3
"""
Generate complete SQL migration from Word dreams to Supabase.
Tries to execute directly via Supabase REST API (with service_role key if available),
otherwise outputs SQL files for manual execution.
"""

import json
import re
import os
import sys

# === CONFIG ===
# Try to get service role key from environment
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
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

# === LOAD COMPARISON RESULTS ===
with open("compare_results.json", "r", encoding="utf-8") as f:
    results = json.load(f)

to_add = results["to_add"]
to_update = results["to_update"]

print(f"Loaded: {len(to_add)} ADD + {len(to_update)} UPDATE")


# === HELPERS ===
def tr_to_ascii(text):
    text = text.replace("\u0131", "i").replace("\u0130", "i")
    text = text.replace("\u011f", "g").replace("\u011e", "g")
    text = text.replace("\u00fc", "u").replace("\u00dc", "u")
    text = text.replace("\u015f", "s").replace("\u015e", "s")
    text = text.replace("\u00f6", "o").replace("\u00d6", "o")
    text = text.replace("\u00e7", "c").replace("\u00c7", "c")
    text = text.replace("\u00ee", "i")
    return text


def plain_to_html(text):
    """Convert plain text with newlines to simple HTML paragraphs."""
    lines = text.strip().split("\n")
    html_parts = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        escaped = (
            line.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
        )
        html_parts.append(f"<p>{escaped}</p>")
    return " ".join(html_parts)


def generate_slug(title):
    slug = title.lower()
    slug = tr_to_ascii(slug)
    slug = re.sub(r"[^a-z0-9]+", "-", slug).strip("-")
    return slug


def extract_keywords(content, title, max_count=6):
    """Extract meaningful keywords from content."""
    text = re.sub(r"<[^>]*>", " ", content)
    text = re.sub(
        r"[^a-zA-Z\u00e7\u011f\u0131\u00f6\u015f\u00fc\u00c7\u011e\u0130\u00d6\u015e\u00dc\s]",
        " ",
        text,
    )
    words = text.lower().split()
    stop_words = {
        "ve",
        "ile",
        "icin",
        "bir",
        "bu",
        "su",
        "da",
        "de",
        "ki",
        "ama",
        "gibi",
        "kadar",
        "sonra",
        "once",
        "sonra",
        "daha",
        "cok",
        "az",
        "her",
        "hic",
        "bazi",
        "tum",
        "butun",
        "ise",
        "iken",
        "diye",
        "kendi",
        "kendisi",
        "bunu",
        "onu",
        "sanki",
        "gore",
        "karsi",
        "dogr",
        "kadar",
        "dolay",
        "bile",
        "hem",
        "ne",
        "ya",
        "veya",
        "icin",
        "kadar",
        "ancak",
        "fakat",
        "cunku",
        "daha",
    }
    words = [w for w in words if len(w) > 3 and w not in stop_words]
    freq = {}
    for w in words:
        freq[w] = freq.get(w, 0) + 1
    sorted_words = sorted(freq.items(), key=lambda x: -x[1])
    return [w.capitalize() for w, _ in sorted_words[:max_count]]


def sql_escape(val):
    return val.replace("'", "''")


def generate_meta_title(title):
    t = re.sub(r"<[^>]*>", "", title).strip()
    return t[:57] + "..." if len(t) > 57 else t


def generate_meta_description(content):
    text = re.sub(r"<[^>]*>", " ", content).strip()
    text = re.sub(r"\s+", " ", text)
    sentences = re.split(r"[.!?]+", text)
    desc = (sentences[0] if sentences else text)[:157]
    if not desc.endswith("."):
        desc += "."
    return desc


# === GENERATE SQL ===
add_count = 0
update_count = 0
error_count = 0

sql_lines = [
    "-- ================================================",
    "-- MIGRATION: Rüya Tabirleri - Word'den Supabase'e",
    f"-- Tarih: {__import__('datetime').datetime.now().isoformat()}",
    f"-- ADD: {len(to_add)} yeni rüya",
    f"-- UPDATE: {len(to_update)} mevcut rüya (Word içeriği ile değiştirilecek)",
    "-- ================================================",
    "",
    "BEGIN;",
    "",
]

for d in to_add:
    title = d["title"]
    content = d["content"]
    slug = generate_slug(title)
    html_content = plain_to_html(content)
    keywords = extract_keywords(html_content, title)
    meta_title = generate_meta_title(title)
    meta_desc = generate_meta_description(html_content)

    add_count += 1
    sql_lines.append(f"-- ADD {add_count}: {title}")
    sql_lines.append(
        f"INSERT INTO public.dreams (title, slug, content, is_published, is_featured, "
        f"keywords, meta_title, meta_description, created_at, updated_at) VALUES ("
    )
    sql_lines.append(f"  '{sql_escape(title)}',")
    sql_lines.append(f"  '{sql_escape(slug)}',")
    sql_lines.append(f"  $content${html_content}$content$,")
    sql_lines.append(f"  true, false,")
    kw_quoted = ",".join("'" + sql_escape(k) + "'" for k in keywords)
    sql_lines.append(f"  ARRAY[{kw_quoted}],")
    sql_lines.append(f"  '{sql_escape(meta_title)}',")
    sql_lines.append(f"  '{sql_escape(meta_desc)}',")
    sql_lines.append(f"  now(), now()")
    sql_lines.append(f");")
    sql_lines.append("")

for u in to_update:
    word_title = u["word_title"]
    word_content = u["word_content"]
    existing_id = u["existing_id"]
    existing_title = u["existing_title"]

    html_content = plain_to_html(word_content)
    keywords = extract_keywords(html_content, word_title)
    meta_title = generate_meta_title(word_title)
    meta_desc = generate_meta_description(html_content)
    slug = generate_slug(word_title)

    update_count += 1
    sql_lines.append(
        f"-- UPDATE {update_count}: '{word_title}' (was: '{existing_title}')"
    )
    sql_lines.append(f"UPDATE public.dreams SET")
    sql_lines.append(f"  title = '{sql_escape(word_title)}',")
    sql_lines.append(f"  slug = '{sql_escape(slug)}',")
    sql_lines.append(f"  content = $content${html_content}$content$,")
    kw_quoted = ",".join("'" + sql_escape(k) + "'" for k in keywords)
    sql_lines.append(f"  keywords = ARRAY[{kw_quoted}],")
    sql_lines.append(f"  meta_title = '{sql_escape(meta_title)}',")
    sql_lines.append(f"  meta_description = '{sql_escape(meta_desc)}',")
    sql_lines.append(f"  updated_at = now()")
    sql_lines.append(f"WHERE id = '{existing_id}';")
    sql_lines.append("")

sql_lines.append("COMMIT;")
sql_lines.append("")
sql_lines.append("-- Migration completed")
sql_lines.append(f"-- ADD: {add_count}, UPDATE: {update_count}")

# Write SQL file
sql_text = "\n".join(sql_lines)

# Check file size
sql_size = len(sql_text.encode("utf-8"))
print(f"\nSQL file size: {sql_size:,} bytes ({sql_size / 1024 / 1024:.1f} MB)")

# If too large for the Supabase SQL Editor, split into chunks
MAX_CHUNK_SIZE = 10 * 1024 * 1024  # 10 MB per chunk

if sql_size > MAX_CHUNK_SIZE:
    print("SQL file too large, splitting into chunks...")
    chunks = []
    current_chunk = []
    current_size = 0

    for line in sql_lines:
        line_size = len(line.encode("utf-8")) + 1
        if current_size + line_size > MAX_CHUNK_SIZE and current_chunk:
            chunks.append(current_chunk)
            current_chunk = [line]
            current_size = line_size
        else:
            current_chunk.append(line)
            current_size += line_size

    if current_chunk:
        chunks.append(current_chunk)

    for i, chunk in enumerate(chunks):
        fn = f"migration_part_{i + 1}_of_{len(chunks)}.sql"
        with open(fn, "w", encoding="utf-8") as f:
            f.write("\n".join(chunk))
        print(f"  {fn}: {sum(len(l.encode('utf-8')) + 1 for l in chunk):,} bytes")
else:
    with open("migration_complete.sql", "w", encoding="utf-8") as f:
        f.write(sql_text)
    print(f"  migration_complete.sql written")

# === TRY DIRECT EXECUTION VIA SUPABASE REST API ===
executed_directly = False

if SERVICE_ROLE_KEY:
    print("\n=== Attempting direct execution via Supabase REST API ===")
    try:
        import httpx

        headers = {
            "apikey": SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
        }

        # ADD via REST API
        for d in to_add:
            title = d["title"]
            content = d["content"]
            slug = generate_slug(title)
            html_content = plain_to_html(content)
            keywords = extract_keywords(html_content, title)

            payload = {
                "title": title,
                "slug": slug,
                "content": html_content,
                "is_published": True,
                "is_featured": False,
                "keywords": keywords,
                "meta_title": generate_meta_title(title),
                "meta_description": generate_meta_description(html_content),
            }

            r = httpx.post(
                f"{SUPABASE_URL}/rest/v1/dreams",
                headers=headers,
                json=payload,
                timeout=10,
            )
            if r.status_code not in (200, 201):
                print(f"  ERROR adding '{title}': {r.status_code} {r.text[:100]}")
                error_count += 1

        # UPDATE via REST API
        for u in to_update:
            word_title = u["word_title"]
            word_content = u["word_content"]
            existing_id = u["existing_id"]
            html_content = plain_to_html(word_content)
            keywords = extract_keywords(html_content, word_title)
            slug = generate_slug(word_title)

            payload = {
                "title": word_title,
                "slug": slug,
                "content": html_content,
                "keywords": keywords,
                "meta_title": generate_meta_title(word_title),
                "meta_description": generate_meta_description(html_content),
                "updated_at": "now()",
            }

            r = httpx.patch(
                f"{SUPABASE_URL}/rest/v1/dreams?id=eq.{existing_id}",
                headers=headers,
                json=payload,
                timeout=10,
            )
            if r.status_code not in (200, 204):
                print(
                    f"  ERROR updating '{word_title}': {r.status_code} {r.text[:100]}"
                )
                error_count += 1

        executed_directly = True
        print(f"Direct execution completed! Errors: {error_count}")

    except Exception as e:
        print(f"  Direct execution failed: {e}")

# === SUMMARY ===
print(f"\n{'=' * 50}")
print(f"MIGRATION SUMMARY")
print(f"{'=' * 50}")
print(f"  ADD: {add_count} new dreams")
print(f"  UPDATE: {update_count} existing dreams")
if executed_directly:
    print(f"  STATUS: Executed directly via REST API")
else:
    print(f"  STATUS: SQL file(s) generated")
    print(f"\n  === TO APPLY ===")
    print(f"  1. Open https://supabase.com/dashboard/project/dagjpitlouekbnwdcpbz")
    print(f"  2. Go to SQL Editor")
    if sql_size > MAX_CHUNK_SIZE:
        for i in range(len(chunks)):
            print(f"  3. Paste and run migration_part_{i + 1}_of_{len(chunks)}.sql")
    else:
        print(f"  3. Paste and run migration_complete.sql")
    print(f"  4. Verify the results")
    print(f"\n  NOTE: Set environment variable SUPABASE_SERVICE_ROLE_KEY")
    print(f"  to enable automatic execution next time.")

if error_count > 0:
    print(f"\n  WARNING: {error_count} errors occurred!")
else:
    print(f"\n  All operations completed successfully!")
