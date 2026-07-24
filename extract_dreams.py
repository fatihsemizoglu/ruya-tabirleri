import sys
from docx import Document

WORD_PATH = (
    r"C:\Users\fsemi\OneDrive\Masaüstü\Ruya_Tabirleri_Baslik_ve_Aciklamalar.docx"
)

doc = Document(WORD_PATH)

dreams = []
current_title = None
current_content = []


def save_current():
    global current_title, current_content
    if current_title:
        content = "\n".join(current_content).strip()
        if content:
            dreams.append({"title": current_title, "content": content})
    current_title = None
    current_content = []


for para in doc.paragraphs:
    text = para.text.strip()
    if not text:
        continue
    style = para.style.name if para.style else ""
    if "Heading" in style or "Başlık" in style or "Title" in style:
        save_current()
        current_title = text
    elif current_title is None:
        current_title = text
    else:
        current_content.append(text)

save_current()

print(f"Total dreams extracted: {len(dreams)}")
print("=" * 60)

import json

with open("word_dreams.json", "w", encoding="utf-8") as f:
    json.dump(dreams, f, ensure_ascii=False, indent=2)

for i, d in enumerate(dreams, 1):
    preview = d["content"][:100].replace("\n", " ")
    print(f"{i:3d}. {d['title'][:60]}")
    print(f"     İçerik: {preview}...")
    print()
