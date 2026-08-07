import { describe, it, expect } from "vitest";
import {
  escapeSupabaseOrValue,
  normalizeSearchTerm,
  toSlugTerm,
  uniqueDreamResults,
  applyFiltersClientSide,
  type AdvancedFilterState,
} from "./search-filters";
import type { DreamSearchResult } from "@/types/database";

const makeDream = (overrides: Partial<DreamSearchResult> & { id: string }): DreamSearchResult => ({
  title: "Test Rüyası",
  slug: "test-ruyasi",
  content: "içerik",
  category_id: null,
  view_count: 0,
  like_count: 0,
  is_featured: false,
  created_at: "2026-01-01T00:00:00.000Z",
  rank: 0,
  ...overrides,
});

const baseFilters = (overrides: Partial<AdvancedFilterState> = {}): AdvancedFilterState => ({
  showFeaturedOnly: false,
  selectedCategories: [],
  minViews: 0,
  minLikes: 0,
  sortBy: "relevance",
  ...overrides,
});

describe("normalizeSearchTerm", () => {
  it("Türkçe karakterleri normalleştirir", () => {
    expect(normalizeSearchTerm("Yılan")).toBe("yilan");
    expect(normalizeSearchTerm("GÜVERCİN")).toBe("guvercin");
    expect(normalizeSearchTerm("Şeytan Çarpması")).toBe("seytan carpmasi");
    expect(normalizeSearchTerm("Ölüm")).toBe("olum");
  });

  it("boşlukları temizler ve küçük harfe çevirir", () => {
    expect(normalizeSearchTerm("  Su  ")).toBe("su");
  });
});

describe("escapeSupabaseOrValue", () => {
  it("Supabase ilike için tehlikeli karakterleri kaldırır", () => {
    expect(escapeSupabaseOrValue("100% gerçek")).toBe("100 gerçek");
    expect(escapeSupabaseOrValue("a(b)c")).toBe("abc");
    expect(escapeSupabaseOrValue("süper, normal")).toBe("süper normal");
    expect(escapeSupabaseOrValue("tırnak {işareti}")).toBe("tırnak işareti");
  });
});

describe("toSlugTerm", () => {
  it("arama terimini slug biçimine çevirir", () => {
    expect(toSlugTerm("Rüyada Yılan")).toBe("ruyada-yilan");
    expect(toSlugTerm("  Deniz & Kumsal  ")).toBe("deniz-kumsal");
  });
});

describe("uniqueDreamResults", () => {
  it("aynı id'ye sahip sonuçları tekil yapar", () => {
    const rows = [
      makeDream({ id: "a", title: "A1" }),
      makeDream({ id: "a", title: "A2" }),
      makeDream({ id: "b" }),
    ];
    const unique = uniqueDreamResults(rows);
    expect(unique).toHaveLength(2);
    expect(unique.map((r) => r.id).sort()).toEqual(["a", "b"]);
  });

  it("boş listeyi korur", () => {
    expect(uniqueDreamResults([])).toEqual([]);
  });
});

describe("applyFiltersClientSide", () => {
  const rows = [
    makeDream({ id: "f1", is_featured: true, view_count: 500, like_count: 20, category_id: "cat1", rank: 1, created_at: "2026-03-01T00:00:00.000Z" }),
    makeDream({ id: "n1", is_featured: false, view_count: 1000, like_count: 50, category_id: "cat2", rank: 3, created_at: "2026-02-01T00:00:00.000Z" }),
    makeDream({ id: "n2", is_featured: false, view_count: 100, like_count: 5, category_id: "cat1", rank: 2, created_at: "2026-01-01T00:00:00.000Z" }),
  ];

  it("showFeaturedOnly filtreler", () => {
    const result = applyFiltersClientSide(rows, baseFilters({ showFeaturedOnly: true }));
    expect(result.map((r) => r.id)).toEqual(["f1"]);
  });

  it("kategori filtreler", () => {
    const result = applyFiltersClientSide(rows, baseFilters({ selectedCategories: ["cat1"] }));
    expect(result.map((r) => r.id).sort()).toEqual(["f1", "n2"]);
  });

  it("minViews eşiğini uygular", () => {
    const result = applyFiltersClientSide(rows, baseFilters({ minViews: 500 }));
    expect(result.map((r) => r.id).sort()).toEqual(["f1", "n1"]);
  });

  it("minLikes eşiğini uygular", () => {
    const result = applyFiltersClientSide(rows, baseFilters({ minLikes: 20 }));
    expect(result.map((r) => r.id).sort()).toEqual(["f1", "n1"]);
  });

  it("sortBy=views ile görüntülenmeye göre sıralar", () => {
    const result = applyFiltersClientSide(rows, baseFilters({ sortBy: "views" }));
    expect(result.map((r) => r.id)).toEqual(["n1", "f1", "n2"]);
  });

  it("sortBy=likes ile beğeniye göre sıralar", () => {
    const result = applyFiltersClientSide(rows, baseFilters({ sortBy: "likes" }));
    expect(result.map((r) => r.id)).toEqual(["n1", "f1", "n2"]);
  });

  it("sortBy=newest ile tarihe göre sıralar", () => {
    const result = applyFiltersClientSide(rows, baseFilters({ sortBy: "newest" }));
    expect(result.map((r) => r.id)).toEqual(["f1", "n1", "n2"]);
  });

  it("sortBy=relevance ile rank'a göre sıralar (varsayılan)", () => {
    const result = applyFiltersClientSide(rows, baseFilters());
    expect(result.map((r) => r.id)).toEqual(["n1", "n2", "f1"]);
  });

  it("birden fazla filtreyi birlikte uygular", () => {
    const result = applyFiltersClientSide(
      rows,
      baseFilters({ selectedCategories: ["cat1", "cat2"], minViews: 100, sortBy: "views" }),
    );
    expect(result.map((r) => r.id)).toEqual(["n1", "f1", "n2"]);
  });

  it("filtre yokken tüm satırları korur", () => {
    expect(applyFiltersClientSide(rows, baseFilters())).toHaveLength(3);
  });

  it("orijinal diziyi değiştirmez (immutability)", () => {
    const copy = [...rows];
    applyFiltersClientSide(rows, baseFilters({ sortBy: "views" }));
    expect(rows.map((r) => r.id)).toEqual(copy.map((r) => r.id));
  });
});
