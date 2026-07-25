import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: stats, error: statsError } = await supabase
      .from("global_dream_stats")
      .select("*")
      .single();

    if (statsError) {
      console.error("Stats query error:", statsError);
      return jsonResponse({ error: statsError.message }, 500);
    }

    const { data: trends, error: trendsError } = await supabase
      .from("daily_dream_trends")
      .select("*")
      .limit(30);

    if (trendsError) {
      console.error("Trends query error:", trendsError);
    }

    return jsonResponse({
      success: true,
      stats,
      trends: trends || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("dream-statistics error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
