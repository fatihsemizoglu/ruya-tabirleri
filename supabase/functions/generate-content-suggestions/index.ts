import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content, currentKeywords, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = type === "keywords" 
      ? `Sen bir SEO ve içerik uzmanısın. Verilen rüya tabiri için en uygun anahtar kelimeleri öner.
         Kurallar:
         - 8-12 adet anahtar kelime öner
         - Türkçe anahtar kelimeler kullan
         - Tek kelime veya kısa ifadeler olsun (max 3 kelime)
         - Rüya tabiri aramaları için uygun olsun
         - Genel ve spesifik kelimeleri dengele
         JSON formatında döndür: { "keywords": ["kelime1", "kelime2", ...] }`
      : `Sen bir rüya tabiri uzmanısın. Verilen rüya tabiri ile ilişkili olabilecek diğer rüya konularını öner.
         Kurallar:
         - 5-8 adet ilişkili rüya konusu öner
         - Her öneri için kısa bir açıklama ekle (neden ilişkili olduğunu)
         - Türkçe kullan
         - Sembolik, psikolojik veya tematik bağlantılar kur
         JSON formatında döndür: { "suggestions": [{ "title": "Rüya Başlığı", "reason": "İlişki açıklaması" }, ...] }`;

    const userPrompt = type === "keywords"
      ? `Rüya Başlığı: ${title}
         Mevcut Anahtar Kelimeler: ${currentKeywords?.join(", ") || "Yok"}
         
         İçerik Özeti: ${content?.substring(0, 500) || ""}
         
         Bu rüya tabiri için SEO açısından etkili anahtar kelimeler öner.`
      : `Rüya Başlığı: ${title}
         
         İçerik: ${content?.substring(0, 800) || ""}
         
         Bu rüya tabiri ile tematik, sembolik veya psikolojik açıdan ilişkili olabilecek diğer rüya konularını öner.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit aşıldı, lütfen biraz bekleyin." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Kredi limiti doldu, lütfen hesabınızı kontrol edin." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI servisi hatası");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("AI yanıtı alınamadı");
    }

    // Parse JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Geçerli JSON yanıtı alınamadı");
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Content suggestions error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Bilinmeyen hata" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
