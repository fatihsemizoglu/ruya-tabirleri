import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";

interface DreamMatch {
  id: string;
  title: string;
  slug: string;
  content: string;
  islamic_interpretation: string | null;
  psychological_interpretation: string | null;
  keywords: string[];
  category_id: string | null;
  view_count: number;
}

function extractWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zçğıöşü0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      return jsonResponse({ error: "Sunucu yapılandırması eksik" }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { dreamText } = await req.json();
    if (!dreamText || dreamText.length < 10) {
      return jsonResponse({ error: "Rüya metni çok kısa (en az 10 karakter)" }, 400);
    }

    const words = extractWords(dreamText);

    const seenIds = new Set<string>();
    const rankedResults: Array<{ id: string; matchCount: number }> = [];

    function addMatch(id: string) {
      if (seenIds.has(id)) {
        const existing = rankedResults.find((r) => r.id === id);
        if (existing) existing.matchCount++;
      } else {
        seenIds.add(id);
        rankedResults.push({ id, matchCount: 1 });
      }
    }

    for (const word of words) {
      const { data: keywordMatches } = await supabase
        .from("dreams")
        .select("id")
        .eq("is_published", true)
        .contains("keywords", [word]);

      if (keywordMatches) {
        for (const m of keywordMatches) addMatch(m.id);
      }

      const { data: titleMatches } = await supabase
        .from("dreams")
        .select("id")
        .eq("is_published", true)
        .ilike("title", `%${word}%`);

      if (titleMatches) {
        for (const m of titleMatches) addMatch(m.id);
      }

      const { data: contentMatches } = await supabase
        .from("dreams")
        .select("id")
        .eq("is_published", true)
        .ilike("content", `%${word}%`);

      if (contentMatches) {
        for (const m of contentMatches) addMatch(m.id);
      }
    }

    rankedResults.sort((a, b) => b.matchCount - a.matchCount);
    const topIds = rankedResults.slice(0, 10).map((r) => r.id);

    if (topIds.length === 0) {
      return jsonResponse(
        { error: "Bu rüya için henüz tabir bulunamadı." },
        404,
      );
    }

    const { data: dreams } = await supabase
      .from("dreams")
      .select("id, title, slug, content, islamic_interpretation, psychological_interpretation, keywords, category_id, view_count")
      .eq("is_published", true)
      .in("id", topIds);

    if (!dreams || dreams.length === 0) {
      return jsonResponse(
        { error: "Bu rüya için henüz tabir bulunamadı." },
        404,
      );
    }

    const typedDreams = dreams as DreamMatch[];
    const idOrder = new Map(topIds.map((id, i) => [id, i]));
    typedDreams.sort((a, b) => (idOrder.get(a.id) ?? 999) - (idOrder.get(b.id) ?? 999));

    const bestMatch = typedDreams[0]!;
    const similarDreams = typedDreams.slice(1, 6).map((d) => ({
      id: d.id,
      title: d.title,
      slug: d.slug,
    }));

    return jsonResponse({
      islamic_interpretation: bestMatch.islamic_interpretation || "Bu rüya için İslami tabir bulunmuyor.",
      psychological_interpretation: bestMatch.psychological_interpretation || "Bu rüya için psikolojik yorum bulunmuyor.",
      keywords: bestMatch.keywords || [],
      general_meaning: bestMatch.content.split(".").slice(0, 2).join(".") + ".",
      similarDreams: similarDreams.length > 0 ? similarDreams : undefined,
    });
  } catch (error) {
    console.error("interpret-dream error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Bilinmeyen hata" },
      500,
    );
  }
});
