import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";

const STOP_WORDS = new Set([
  "bir", "ve", "ile", "icin", "için", "ama", "veya", "bu", "o", "da", "de",
  "den", "dan", "a", "e", "cok", "çok", "daha", "en", "gibi", "kadar",
  "sonra", "once", "önce", "altinda", "altında", "ustunde", "üstünde", "icinde", "içinde", "disinda", "dışında",
  "arasinda", "arasında", "uzerinde", "üzerinde", "karsi", "karşı", "yani", "ancak", "fakat",
  "lakin", "cunku", "çünkü", "ayrica", "ayrıca", "hatta", "ozellikle", "özellikle", "genelde",
  "sadece", "hep", "hic", "hiç", "biraz", "tum", "tüm", "her", "kendi",
  "ben", "sen", "biz", "siz", "onlar", "bana", "sana", "ona", "bize", "size", "onlara",
  "benim", "senin", "onun", "bizim", "sizin", "onlarin", "onların", "buraya", "oraya", "orada",
  "burada", "suraya", "şuraya", "surada", "şurada", "oyle", "öyle", "boyle", "böyle",
  "bunu", "sunu", "şunu", "onu", "buna", "suna", "şuna", "oldu", "oldugunu", "olduğunu",
  "oluyor", "olmus", "olmuş", "olacak", "olan", "olarak", "olunca", "olup", "olsa", "olsun",
  "gordu", "gördü", "goruyor", "görüyor", "gormus", "görmüş", "gormek", "görmek", "gorulen", "görülen",
  "gorup", "görüp", "gorunce", "görünce", "gordugunu", "gördüğünü", "gordugum", "gördüğüm",
  "ruyamda", "rüyamda", "ruyada", "rüyada", "ruyam", "rüyam", "ruyasi", "rüyası", "ruyalar", "rüyalar",
  "sanki", "aniden", "birden", "sonunda", "nihayet", "acaba", "belki", "tam", "hemen", "yine", "zaten",
  "bile", "ise", "degil", "değil", "mi", "mu", "mü", "mı",
]);

const TURKISH_SUFFIXES = [
  "leri", "lari", "ları", "lar", "ler",
  "imiz", "ınız", "iniz", "umız", "umuz", "ümüz", "imizi", "inizi", "imize", "inize",
  "imizda", "imizde", "inizda", "inizde", "imizdan", "imizden", "inizdan", "inizden",
  "imizin", "inizin", "miz", "nız", "niz", "muz", "müz",
  "im", "ım", "um", "üm", "in", "ın", "un", "ün",
  "imde", "ımda", "umda", "ümde", "inda", "ında", "inde", "imde",
  "imden", "ımdan", "umdan", "ümden", "indan", "ından", "inden",
  "sini", "sına", "sina", "sine", "sinin", "sında", "sinda", "sinde", "sından", "sindan", "sinden",
  "sin", "sın", "sun", "sün", "i", "ı", "u", "ü", "a", "e", "da", "de", "dan", "den",
  "nin", "nın", "nun", "nün", "n", "yla", "yle",
];

interface DreamMatch {
  id: string;
  title: string;
  slug: string;
  islamic_interpretation: string | null;
  psychological_interpretation: string | null;
  keywords: string[] | null;
  view_count: number | null;
}

function removeTurkishSuffixes(word: string): string[] {
  const variants = [word];
  for (const suffix of TURKISH_SUFFIXES) {
    if (word.length > suffix.length + 2 && word.endsWith(suffix)) {
      variants.push(word.slice(0, -suffix.length));
    }
  }
  return variants;
}

function extractKeywords(text: string): string[] {
  const words = text
    .toLocaleLowerCase("tr-TR")
    .replace(/[^a-zçğıöşü0-9 ]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));

  return [...new Set(words)];
}

function buildKeywordVariants(words: string[]): Set<string> {
  const variants = new Set<string>();
  for (const word of words) {
    for (const variant of removeTurkishSuffixes(word)) {
      variants.add(variant);
    }
  }
  return variants;
}

function scoreMatch(words: string[], wordVariants: Set<string>, dream: DreamMatch): number {
  let score = 0;
  const lowerTitle = dream.title.toLocaleLowerCase("tr-TR");
  const dreamKeywords = (dream.keywords ?? []).map((keyword) => keyword.toLocaleLowerCase("tr-TR"));

  for (const variant of wordVariants) {
    if (dreamKeywords.some((keyword) => keyword.includes(variant))) score += 20;
    if (lowerTitle.includes(variant)) score += 5;
  }

  for (const word of words) {
    if (dreamKeywords.some((keyword) => keyword.includes(word))) score += 15;
    if (lowerTitle.includes(word)) score += 3;
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
      return jsonResponse({ error: "Sunucu yapılandırması eksik" }, 500, req.headers.get("origin"));
    }

    const { dreamText } = await req.json();
    const normalizedDreamText = typeof dreamText === "string" ? dreamText.trim() : "";

    if (normalizedDreamText.length < 10) {
      return jsonResponse({ error: "Rüya metni çok kısa (en az 10 karakter)" }, 400, req.headers.get("origin"));
    }

    const words = extractKeywords(normalizedDreamText);
    if (words.length === 0) {
      return jsonResponse({ error: "Rüya metninden anlamlı kelimeler çıkarılamadı." }, 400, req.headers.get("origin"));
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const wordVariants = buildKeywordVariants(words);

    const { data: allDreams, error } = await supabase
      .from("dreams")
      .select("id, title, slug, islamic_interpretation, psychological_interpretation, keywords, view_count")
      .eq("is_published", true);

    if (error) {
      console.error("interpret-dream database error:", error);
      return jsonResponse({ error: "Rüya tabirleri alınamadı" }, 500, req.headers.get("origin"));
    }

    if (!allDreams || allDreams.length === 0) {
      return jsonResponse({ error: "Veritabanında henüz rüya tabiri bulunmuyor." }, 404, req.headers.get("origin"));
    }

    const scored = (allDreams as DreamMatch[])
      .map((dream) => ({ dream, score: scoreMatch(words, wordVariants, dream) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || (b.dream.view_count ?? 0) - (a.dream.view_count ?? 0));

    if (scored.length === 0) {
      return jsonResponse({ error: "Bu rüya ile eşleşen tabir bulunamadı." }, 404, req.headers.get("origin"));
    }

    const bestMatch = scored[0]!.dream;
    const similarDreams = scored.slice(1, 6).map(({ dream }) => ({
      id: dream.id,
      title: dream.title,
      slug: dream.slug,
    }));

    return jsonResponse({
      islamic_interpretation: bestMatch.islamic_interpretation || "Bu rüya için İslami tabir bulunmuyor.",
      psychological_interpretation: bestMatch.psychological_interpretation || "Bu rüya için psikolojik yorum bulunmuyor.",
      keywords: bestMatch.keywords || [],
      general_meaning: bestMatch.islamic_interpretation
        ? `${bestMatch.islamic_interpretation.split(".").slice(0, 2).join(".")}.`
        : `${bestMatch.title} hakkında detaylı yorum.`,
      similarDreams: similarDreams.length > 0 ? similarDreams : undefined,
    }, 200, req.headers.get("origin"));
  } catch (error) {
    console.error("interpret-dream error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Bilinmeyen hata" },
      500,
      req.headers.get("origin"),
    );
  }
});