import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  const headerSecret = req.headers.get("x-cron-secret") || req.headers.get("authorization")?.replace("Bearer ", "");
  
  if (!cronSecret || headerSecret !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get zero-result searches from last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: searches } = await supabase
      .from("search_logs")
      .select("query, created_at, user_id")
      .eq("results_count", 0)
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    // Group by query
    const queryStats = (searches || []).reduce((acc, log) => {
      const key = log.query.toLowerCase().trim();
      if (!acc[key]) {
        acc[key] = { query: log.query, count: 0, users: new Set(), last_searched: log.created_at };
      }
      acc[key].count++;
      acc[key].users.add(log.user_id);
      return acc;
    }, {} as Record<string, { query: string; count: number; users: Set<string>; last_searched: string }>);

    const topZeroResults = Object.values(queryStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
      .map(item => ({
        query: item.query,
        count: item.count,
        unique_users: item.users.size,
        last_searched: item.last_searched,
      }));

    // Log summary
    await supabase.from("zero_results_daily").insert({
      date: new Date().toISOString().split("T")[0],
      total_zero_searches: searches?.length || 0,
      unique_queries: Object.keys(queryStats).length,
      top_queries: topZeroResults,
      created_at: new Date().toISOString(),
    });

    // If top queries have high count, could trigger content suggestion
    const highPriority = topZeroResults.filter(q => q.count >= 5).length;

    return new Response(JSON.stringify({
      success: true,
      period: "24h",
      total_zero_searches: searches?.length || 0,
      unique_zero_queries: Object.keys(queryStats).length,
      top_queries: topZeroResults,
      high_priority_count: highPriority,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Zero results cron error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});