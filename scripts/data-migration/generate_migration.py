import json
import re

# Read the comparison results
with open('compare_results.json', 'r', encoding='utf-8') as f:
    results = json.load(f)

to_add = results['to_add']
to_update = results['to_update']

def plain_text_to_html(text, title):
    lines = text.strip().split('\n')
    html_parts = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        line_escaped = (line
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;'))
        html_parts.append(f'<p>{line_escaped}</p>')
    return '\n'.join(html_parts)

def generate_slug(title):
    slug = title.lower()
    slug = slug.replace('\u011f', 'g').replace('\u00fc', 'u').replace('\u015f', 's')
    slug = slug.replace('\u0131', 'i').replace('\u00f6', 'o').replace('\u00e7', 'c')
    slug = re.sub(r'[\(\)\[\],.\\/]', '', slug)
    slug = re.sub(r'[^a-z0-9]+', '-', slug).strip('-')
    return f'ruyada-{slug}-gormek'

def truncate(text, max_len):
    if len(text) <= max_len:
        return text
    return text[:max_len-3] + '...'

# Generate ADD SQL
add_sql_lines = [
    "-- ===============================================",
    "-- RUYA TABIRLERI: ADD new dreams from Word document",
    "-- Generated automatically",
    f"-- Total: {len(to_add)} new dreams",
    "-- ===============================================",
    "",
]

for i, d in enumerate(to_add):
    title = d['title']
    content = d['content']
    slug = generate_slug(title)
    html_content = plain_text_to_html(content, title)
    
    # Escape for SQL
    title_escaped = title.replace("'", "''")
    content_escaped = html_content.replace("'", "''")
    
    add_sql_lines.append(f"-- {i+1}. {title}")
    add_sql_lines.append(
        f"INSERT INTO public.dreams (title, slug, content, is_published, is_featured, keywords, meta_title, meta_description) "
        f"VALUES ("
        f"'{title_escaped}', "
        f"'{slug}', "
        f"'{content_escaped}', "
        f"true, false, "
        f"'{{}}', "
        f"'{truncate(title_escaped, 60).replace(\"'\", \"''\")}', "
        f"'{truncate(content_escaped.replace(\"<p>\", \"\").replace(\"</p>\", \" \").replace(\"<br>\", \" \"), 160).replace(\"'\", \"''\")}'"
        f");"
    )
    add_sql_lines.append("")

with open('migration_add.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(add_sql_lines))

print(f"Generated migration_add.sql with {len(to_add)} INSERT statements")

# Generate UPDATE SQL
update_sql_lines = [
    "-- ===============================================",
    "-- RUYA TABIRLERI: UPDATE existing dreams with Word content",
    "-- Generated automatically",
    f"-- Total: {len(to_update)} updates",
    "-- ===============================================",
    "",
]

for i, u in enumerate(to_update):
    word_title = u['word_title']
    word_content = u['word_content']
    existing_id = u['existing_id']
    existing_title = u['existing_title']
    match_type = u['match_type']
    
    html_content = plain_text_to_html(word_content, word_title)
    content_escaped = html_content.replace("'", "''")
    title_escaped = word_title.replace("'", "''")
    
    update_sql_lines.append(f"-- {i+1}. '{word_title}' (matched: '{existing_title}' [{match_type}])")
    update_sql_lines.append(
        f"UPDATE public.dreams SET "
        f"title = '{title_escaped}', "
        f"content = '{content_escaped}', "
        f"updated_at = now() "
        f"WHERE id = '{existing_id}';"
    )
    update_sql_lines.append("")

with open('migration_update.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(update_sql_lines))

print(f"Generated migration_update.sql with {len(to_update)} UPDATE statements")

# Generate SUMMARY report
summary_lines = [
    "==========================================",
    "RÜYA TABİRLERİ MIGRATION SUMMARY",
    "==========================================",
    "",
    f"Total Word dreams: {len(to_add) + len(to_update)}",
    f"To ADD (new): {len(to_add)}",
    f"To UPDATE (existing): {len(to_update)}",
    "",
    "--- NEW DREAMS TO ADD ---",
]

for d in to_add:
    summary_lines.append(f"  + {d['title']}")

summary_lines.extend([
    "",
    "--- MATCHED DREAMS TO UPDATE ---",
])

for u in to_update:
    summary_lines.append(f"  ~ '{u['word_title']}' -> '{u['existing_title']}' [{u['match_type']}]")

summary_lines.extend([
    "",
    "==========================================",
    "INSTRUCTIONS",
    "==========================================",
    "1. Open Supabase Dashboard: https://supabase.com/dashboard/project/dagjpitlouekbnwdcpbz",
    "2. Go to SQL Editor",
    "3. First run migration_add.sql",
    "4. Then run migration_update.sql",
    "5. Verify the results",
])

with open('migration_summary.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(summary_lines))

print("\nGenerated migration_summary.txt")
print(f"\nFile sizes:")
import os
for fn in ['migration_add.sql', 'migration_update.sql', 'migration_summary.txt']:
    size = os.path.getsize(fn)
    print(f"  {fn}: {size:,} bytes")
