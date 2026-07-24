import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { requireCronSecret } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  const cronError = requireCronSecret(req);
  if (cronError) return cronError;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase.rpc("run_seo_audit");

    if (error) {
      console.error("SEO audit error:", error);
      return jsonResponse({ error: error.message }, 500);
    }

    console.log("SEO audit completed", data);

    return jsonResponse({
      success: true,
      action: "seo-audit",
      result: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Unexpected error in seo-audit:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
