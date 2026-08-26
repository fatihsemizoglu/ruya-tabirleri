# Veri Migration Araçları (Legacy / Tek Kullanımlık)

Rüya verilerini Word dokümanından (`word_dreams.json`) çıkarıp mevcut DB içeriğiyle
karşılaştıran ve SQL migration üreten tek kullanımlık scriptler.

> ⚠️ Bu scriptler günlük geliştirme akışının parçası değildir; `supabase/migrations/`
> altındaki resmi migration'larla karıştırılmamalıdır.

## Dosyalar

| Dosya | Amaç |
|---|---|
| `extract_dreams.py` | Kaynak veriden `word_dreams.json` üretir |
| `compare_dreams.py` / `compare_dreams_v2.py` | `word_dreams.json` ↔ mevcut DB karşılaştırması → `compare_results.json` |
| `generate_migration.py` | Karşılaştırma sonucundan `migration_add.sql` / `migration_update.sql` üretir |
| `run_migration.py` | Migration SQL'ini parçalara böler / çalıştırır |
| `run_migration_node.js` | Aynı işin Node.js sürümü (`compare_results.json` okur) |
| `test_syntax*.sql` | SQL sözdizimi deneme dosyaları |
| `word_dreams.json`, `existing_dreams.json`, `compare_results.json` | Ara veri dump'ları |

## Kullanım Notu

Scriptler **göreli dosya yollarıyla** çalışır — bu klasörün içinden çalıştırın:

```sh
cd scripts/data-migration
python extract_dreams.py
python compare_dreams_v2.py
python generate_migration.py
```
