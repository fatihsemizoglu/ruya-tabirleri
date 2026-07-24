import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";

const STOP_WORDS = new Set([
  "bir", "ve", "ile", "icin", "ama", "veya", "bu", "o", "da", "de",
  "den", "dan", "a", "e", "cok", "daha", "en", "gibi", "kadar",
  "sonra", "once", "altinda", "ustunde", "icinde", "disinda",
  "arasinda", "uzerinde", "karsi", "yani", "ancak", "fakat",
  "lakin", "cunku", "ayrica", "hatta", "ozellikle", "genelde",
  "sadece", "hep", "hic", "biraz", "tum", "her", "kendi",
  "ben", "sen", "o", "biz", "siz", "onlar", "bana", "sana",
  "ona", "bize", "size", "onlara", "benim", "senin", "onun",
  "bizim", "sizin", "onlarin", "buraya", "oraya", "orada",
  "burada", "suraya", "surada", "oyle", "boyle", "seyle",
  "bunu", "sunu", "onu", "buna", "suna", "ona",
  "oldu", "oldugunu", "oluyor", "olmus", "olacak", "olan",
  "olarak", "olunca", "olup", "olsa", "olsun", "olma",
  "gordu", "goruyor", "gormus", "gormek", "gorulen",
  "gorup", "gorunce", "gordugunu", "gordugum", "gordugun",
  "ruyamda", "ruyada", "ruyam", "ruyasi", "ruyalar",
  "sanki", "aniden", "birden", "sonunda", "nihayet",
  "acaba", "belki", "sanki", "tam", "hemen", "yine",
  "yine de", "zaten", "bile", "ise", "degil", "mi", "mu",
]);

interface DreamMatch {
  id: string;
  title: string;
  slug: string;
  content: string;
  islamic_interpretation: string | null;
  psychological_interpretation: string | null;
  keywords: string[];
  view_count: number;
}

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-zçğıöşü0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
  return [...new Set(words)];
}

function scoreMatch(words: string[], dream: DreamMatch): number {
  let score = 0;
  const lowerTitle = dream.title.toLowerCase();
  const lowerContent = dream.content.toLowerCase();
  const dreamKeywords = (dream.keywords || []).map((k) => k.toLowerCase());

  for (const word of words) {
    if (dreamKeywords.includes(word)) {
      score += 10;
    } else if (lowerTitle.includes(word)) {
      score += 5;
    }
  }

  for (const word of words) {
    if (word.length >= 4 && lowerContent.includes(word)) {
      score += 1;
    }
  }

  return score;
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

    const words = extractKeywords(dreamText);
    if (words.length === 0) {
      return jsonResponse({ error: "Rüya metninden anlamlı kelimeler çıkarılamadı." }, 400);
    }

    const { data: allDreams } = await supabase
      .from("dreams")
      .select("id, title, slug, content, islamic_interpretation, psychological_interpretation, keywords, view_count")
      .eq("is_published", true);

    if (!allDreams || allDreams.length === 0) {
      return jsonResponse({ error: "Veritabanında henüz rüya tabiri bulunmuyor." }, 404);
    }

    const typedDreams = allDreams as DreamMatch[];

    const scored = typedDreams
      .map((d) => ({ dream: d, score: scoreMatch(words, d) }))
      .filter((s) => s.score > 0);

    scored.sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
      return jsonResponse({ error: "Bu rüya ile eşleşen tabir bulunamadı." }, 404);
    }

    const bestMatch = scored[0]!.dream;
    const similarDreams = scored.slice(1, 6).map((s) => ({
      id: s.dream.id,
      title: s.dream.title,
      slug: s.dream.slug,
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
