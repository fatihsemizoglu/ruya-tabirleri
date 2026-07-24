export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export function getCorsHeaders(origin: string | null = null): Record<string, string> {
  const allowed = Deno.env.get("ALLOWED_ORIGINS")
    ?.split(/[\s,]+/)
    .map((o) => o.trim())
    .filter(Boolean) ?? [];
  const defaultOrigin = Deno.env.get("SITE_URL") ?? "*";
  const allowOrigin = origin && allowed.length > 0 && allowed.includes(origin)
    ? origin
    : (allowed[0] ?? defaultOrigin);
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": corsHeaders["Access-Control-Allow-Headers"],
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };
}

export function jsonResponse(body: unknown, status = 200, origin: string | null = null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" },
  });
}

export function handleOptions(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req.headers.get("origin")) });
  }
  return null;
}
