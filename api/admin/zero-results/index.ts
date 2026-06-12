import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ZeroResultQuery {
  query: string;
  count: number;
  last_searched: string;
  user_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list";

    if (action === "list") {
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const offset = parseInt(url.searchParams.get("offset") || "0");

      const { data, error } = await supabase
        .from("search_logs")
        .select("*")
        .eq("results_count", 0)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Group by query and count occurrences
      const grouped = data.reduce((acc, log) => {
        const key = log.query.toLowerCase().trim();
        if (!acc[key]) {
          acc[key] = {
            query: log.query,
            count: 0,
            last_searched: log.created_at,
            user_ids: new Set(),
          };
        }
        acc[key].count++;
        acc[key].last_searched = log.created_at;
        if (log.user_id) acc[key].user_ids.add(log.user_id);
        return acc;
      }, {} as Record<string, { query: string; count: number; last_searched: string; user_ids: Set<string> }>);

      const results = Object.values(grouped)
        .sort((a, b) => b.count - a.count)
        .map(item => ({
          query: item.query,
          count: item.count,
          last_searched: item.last_searched,
          unique_users: item.user_ids.size,
        }));

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "stats") {
      const { count, error } = await supabase
        .from("search_logs")
        .select("*", { count: "exact", head: true })
        .eq("results_count", 0);

      if (error) throw error;

      // Get top 10 zero-result queries
      const { data: topQueries } = await supabase
        .from("search_logs")
        .select("query")
        .eq("results_count", 0)
        .order("created_at", { ascending: false })
        .limit(100);

      const topQueriesCount = topQueries?.reduce((acc, log) => {
        const key = log.query.toLowerCase().trim();
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const sortedTop = Object.entries(topQueriesCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([query, count]) => ({ query, count }));

      return new Response(JSON.stringify({
        total_zero_results: count || 0,
        top_queries: sortedTop,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Zero results API error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});