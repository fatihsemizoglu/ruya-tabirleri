import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { requireCronSecret } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  const cronError = requireCronSecret(req);
  if (cronError) return cronError;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: dreams, error } = await supabase
      .from("dream_journal")
      .select("id, user_id, symbols, tags, content")
      .not("symbols", "is", null)
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) throw error;
    if (!dreams || dreams.length === 0) {
      return jsonResponse({ success: true, matches_created: 0 });
    }

    const matches: { user_id: string; dream_id: string; matched_dream_id: string; similarity_score: number; match_type: string }[] = [];

    for (let i = 0; i < dreams.length; i++) {
      for (let j = i + 1; j < dreams.length; j++) {
        const a = dreams[i];
        const b = dreams[j];
        if (a.user_id !== b.user_id) continue;

        const symA = (a.symbols || []) as string[];
        const symB = (b.symbols || []) as string[];
        const tagsA = (a.tags || []) as string[];
        const tagsB = (b.tags || []) as string[];

        const shared = [...new Set([...symA, ...tagsA])].filter((s) =>
          [...symB, ...tagsB].includes(s)
        );

        if (shared.length === 0) continue;

        const score = shared.length / Math.max([...new Set([...symA, ...tagsA, ...symB, ...tagsB])].length, 1);

        if (score >= 0.2) {
          matches.push({
            user_id: a.user_id,
            dream_id: a.id,
            matched_dream_id: b.id,
            similarity_score: Math.round(score * 100) / 100,
            match_type: "symbol_match",
          });
        }
      }
    }

    if (matches.length === 0) {
      return jsonResponse({ success: true, matches_created: 0 });
    }

    const { error: insertError } = await supabase
      .from("dream_matches")
      .insert(matches);

    if (insertError) throw insertError;

    console.log(`Created ${matches.length} dream matches`);

    return jsonResponse({
      success: true,
      matches_created: matches.length,
    });
  } catch (error) {
    console.error("dream-matcher error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
