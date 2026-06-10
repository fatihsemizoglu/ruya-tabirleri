import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse } from "./cors.ts";

export async function requireAdmin(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Yetkilendirme gerekli" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: "Sunucu yapılandırması eksik" }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: "Geçersiz oturum" }, 401);
  }

  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (rolesError) {
    return jsonResponse({ error: "Rol kontrolü başarısız" }, 500);
  }

  const isAdmin = roles?.some((r) => r.role === "admin") ?? false;
  if (!isAdmin) {
    return jsonResponse({ error: "Admin yetkisi gerekli" }, 403);
  }

  return { userId: user.id };
}

export function requireCronSecret(req: Request): Response | null {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret) {
    return jsonResponse({ error: "CRON_SECRET yapılandırılmamış" }, 500);
  }

  const headerSecret = req.headers.get("x-cron-secret");
  if (headerSecret !== cronSecret) {
    return jsonResponse({ error: "Yetkisiz istek" }, 401);
  }

  return null;
}
