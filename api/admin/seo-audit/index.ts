import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SEOIssue {
  type: "missing_meta" | "duplicate_meta" | "missing_schema" | "short_title" | "long_title" | "short_description" | "long_description" | "missing_og" | "missing_twitter";
  severity: "error" | "warning" | "info";
  page: string;
  message: string;
  fix_suggestion?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const issues: SEOIssue[] = [];
    const baseUrl = Deno.env.get("SITE_URL") || "https://ruya-tabirleri.vercel.app";

    // 1. Check Dreams pages
    const { data: dreams } = await supabase
      .from("dreams")
      .select("slug, title, meta_title, meta_description, content")
      .eq("is_published", true)
      .limit(500);

    for (const dream of dreams || []) {
      const url = `${baseUrl}/ruya/${dream.slug}`;
      
      // Check meta_title
      if (!dream.meta_title) {
        issues.push({
          type: "missing_meta",
          severity: "error",
          page: url,
          message: `Missing meta_title for dream: ${dream.title}`,
          fix_suggestion: "Add meta_title in admin panel",
        });
      } else if (dream.meta_title.length < 30) {
        issues.push({
          type: "short_title",
          severity: "warning",
          page: url,
          message: `Meta title too short (${dream.meta_title.length} chars): ${dream.meta_title}`,
          fix_suggestion: "Aim for 50-60 characters",
        });
      } else if (dream.meta_title.length > 60) {
        issues.push({
          type: "long_title",
          severity: "warning",
          page: url,
          message: `Meta title too long (${dream.meta_title.length} chars): ${dream.meta_title}`,
          fix_suggestion: "Keep under 60 characters",
        });
      }

      // Check meta_description
      if (!dream.meta_description) {
        issues.push({
          type: "missing_meta",
          severity: "error",
          page: url,
          message: `Missing meta_description for dream: ${dream.title}`,
          fix_suggestion: "Add meta_description in admin panel",
        });
      } else if (dream.meta_description.length < 120) {
        issues.push({
          type: "short_description",
          severity: "warning",
          page: url,
          message: `Meta description too short (${dream.meta_description.length} chars)`,
          fix_suggestion: "Aim for 150-160 characters",
        });
      } else if (dream.meta_description.length > 160) {
        issues.push({
          type: "long_description",
          severity: "warning",
          page: url,
          message: `Meta description too long (${dream.meta_description.length} chars)`,
          fix_suggestion: "Keep under 160 characters",
        });
      }

      // Check Schema.org markup potential
      if (dream.content && dream.content.length < 100) {
        issues.push({
          type: "missing_schema",
          severity: "info",
          page: url,
          message: "Content too short for rich schema markup",
          fix_suggestion: "Expand content for better SEO",
        });
      }
    }

    // 2. Check Blog posts
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, title, meta_title, meta_description, content, category:blog_categories(name)")
      .eq("is_published", true)
      .limit(500);

    for (const post of posts || []) {
      const url = `${baseUrl}/blog/${post.slug}`;
      
      if (!post.meta_title) {
        issues.push({
          type: "missing_meta",
          severity: "error",
          page: url,
          message: `Missing meta_title for blog: ${post.title}`,
        });
      } else if (post.meta_title.length < 30 || post.meta_title.length > 60) {
        issues.push({
          type: post.meta_title.length < 30 ? "short_title" : "long_title",
          severity: "warning",
          page: url,
          message: `Meta title length issue (${post.meta_title.length} chars): ${post.meta_title}`,
        });
      }

      if (!post.meta_description) {
        issues.push({
          type: "missing_meta",
          severity: "error",
          page: url,
          message: `Missing meta_description for blog: ${post.title}`,
        });
      } else if (post.meta_description.length < 120 || post.meta_description.length > 160) {
        issues.push({
          type: post.meta_description.length < 120 ? "short_description" : "long_description",
          severity: "warning",
          page: url,
          message: `Meta description length issue (${post.meta_description.length} chars)`,
        });
      }
    }

    // 3. Check Categories
    const { data: categories } = await supabase
      .from("categories")
      .select("slug, name, description")
      .is("parent_id", null)
      .limit(100);

    for (const cat of categories || []) {
      const url = `${baseUrl}/kategori/${cat.slug}`;
      if (!cat.description || cat.description.length < 50) {
        issues.push({
          type: "missing_meta",
          severity: "warning",
          page: url,
          message: `Category missing or short description: ${cat.name}`,
          fix_suggestion: "Add descriptive category text for better SEO",
        });
      }
    }

    // 4. Check for duplicate meta titles/descriptions
    const allPages = [...(dreams || []), ...(posts || [])];
    const titleMap = new Map<string, string[]>();
    const descMap = new Map<string, string[]>();

    for (const page of allPages) {
      if (page.meta_title) {
        const existing = titleMap.get(page.meta_title) || [];
        existing.push(page.slug);
        titleMap.set(page.meta_title, existing);
      }
      if (page.meta_description) {
        const existing = descMap.get(page.meta_description) || [];
        existing.push(page.slug);
        descMap.set(page.meta_description, existing);
      }
    }

    for (const [title, slugs] of titleMap.entries()) {
      if (slugs.length > 1) {
        issues.push({
          type: "duplicate_meta",
          severity: "error",
          page: "multiple",
          message: `Duplicate meta_title "${title}" found on ${slugs.length} pages`,
          fix_suggestion: "Make each meta_title unique",
        });
      }
    }

    for (const [desc, slugs] of descMap.entries()) {
      if (slugs.length > 1) {
        issues.push({
          type: "duplicate_meta",
          severity: "warning",
          page: "multiple",
          message: `Duplicate meta_description found on ${slugs.length} pages`,
          fix_suggestion: "Make each meta_description unique",
        });
      }
    }

    // 5. Check OG/Twitter tags (via meta_title/description presence)
    const missingOG = allPages.filter(p => !p.meta_title || !p.meta_description).length;
    if (missingOG > 0) {
      issues.push({
        type: "missing_og",
        severity: "warning",
        page: "multiple",
        message: `${missingOG} pages missing meta tags needed for Open Graph`,
        fix_suggestion: "Add meta_title and meta_description for social sharing",
      });
    }

    // Summary stats
    const errors = issues.filter(i => i.severity === "error").length;
    const warnings = issues.filter(i => i.severity === "warning").length;
    const infos = issues.filter(i => i.severity === "info").length;

    // Log audit to database
    await supabase.from("seo_audit_logs").insert({
      total_pages_checked: allPages.length + (categories?.length || 0),
      issues_found: issues.length,
      errors,
      warnings,
      infos,
      issues: issues,
      created_at: new Date().toISOString(),
    }).catch(() => {}); // Non-blocking

    return new Response(JSON.stringify({
      summary: {
        total_pages: allPages.length + (categories?.length || 0),
        issues: issues.length,
        errors,
        warnings,
        infos,
        timestamp: new Date().toISOString(),
      },
      issues: issues.slice(0, 200), // Limit response size
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("SEO Audit error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});