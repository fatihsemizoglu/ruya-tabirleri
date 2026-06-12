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

    const baseUrl = Deno.env.get("SITE_URL") || "https://ruya-tabirleri.vercel.app";

    interface SEOIssue {
      type: string;
      page: string;
      title?: string;
      name?: string;
    }
    const issues: SEOIssue[] = [];

    // 1. Check Dreams
    const { data: dreams } = await supabase
      .from("dreams")
      .select("slug, title, meta_title, meta_description")
      .eq("is_published", true);

    for (const dream of dreams || []) {
      if (!dream.meta_title) {
        issues.push({ type: "missing_meta_title", page: `/ruya/${dream.slug}`, title: dream.title });
      }
      if (!dream.meta_description) {
        issues.push({ type: "missing_meta_description", page: `/ruya/${dream.slug}`, title: dream.title });
      }
    }

    // 2. Check Blog Posts
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, title, meta_title, meta_description")
      .eq("is_published", true);

    for (const post of posts || []) {
      if (!post.meta_title) {
        issues.push({ type: "missing_meta_title", page: `/blog/${post.slug}`, title: post.title });
      }
      if (!post.meta_description) {
        issues.push({ type: "missing_meta_description", page: `/blog/${post.slug}`, title: post.title });
      }
    }

    // 3. Check Categories
    const { data: categories } = await supabase
      .from("categories")
      .select("slug, name, description")
      .is("parent_id", null);

    for (const cat of categories || []) {
      if (!cat.description || cat.description.length < 50) {
        issues.push({ type: "thin_category", page: `/kategori/${cat.slug}`, name: cat.name });
      }
    }

    // Log audit
    await supabase.from("seo_audit_logs").insert({
      total_issues: issues.length,
      issues,
      created_at: new Date().toISOString(),
    });

    // If there are critical issues, could send notification here
    const critical = issues.filter(i => i.type.startsWith("missing_meta")).length;
    
    return new Response(JSON.stringify({
      success: true,
      issues_found: issues.length,
      critical_issues: critical,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("SEO Audit cron error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});