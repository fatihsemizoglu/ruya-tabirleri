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

    const staticPages = [
      { url: "/", priority: "1.0", changefreq: "daily" },
      { url: "/hakkimizda", priority: "0.8", changefreq: "monthly" },
      { url: "/iletisim", priority: "0.8", changefreq: "monthly" },
      { url: "/blog", priority: "0.9", changefreq: "daily" },
      { url: "/kategoriler", priority: "0.9", changefreq: "weekly" },
      { url: "/populer", priority: "0.8", changefreq: "daily" },
      { url: "/ara", priority: "0.7", changefreq: "weekly" },
      { url: "/az", priority: "0.8", changefreq: "weekly" },
      { url: "/gizlilik", priority: "0.3", changefreq: "yearly" },
      { url: "/kullanim-kosullari", priority: "0.3", changefreq: "yearly" },
    ];

    const [{ data: dreams }, { data: blogPosts }, { data: categories }, { data: blogCategories }] = await Promise.all([
      supabase.from("dreams").select("slug, updated_at").eq("is_published", true).order("updated_at", { ascending: false }),
      supabase.from("blog_posts").select("slug, updated_at").eq("is_published", true).order("updated_at", { ascending: false }),
      supabase.from("categories").select("slug, updated_at").order("updated_at", { ascending: false }),
      supabase.from("blog_categories").select("slug, updated_at").order("updated_at", { ascending: false }),
    ]);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    for (const page of staticPages) {
      xml += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    }

    if (dreams) {
      for (const dream of dreams) {
        const lastmod = new Date(dream.updated_at).toISOString().split("T")[0];
        xml += `  <url>
    <loc>${baseUrl}/ruya/${dream.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }
    }

    if (blogPosts) {
      for (const post of blogPosts) {
        const lastmod = new Date(post.updated_at).toISOString().split("T")[0];
        xml += `  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }
    }

    if (categories) {
      for (const cat of categories) {
        const lastmod = new Date(cat.updated_at).toISOString().split("T")[0];
        xml += `  <url>
    <loc>${baseUrl}/kategori/${cat.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }
    }

    if (blogCategories) {
      for (const cat of blogCategories) {
        const lastmod = new Date(cat.updated_at).toISOString().split("T")[0];
        xml += `  <url>
    <loc>${baseUrl}/blog/etiket/${cat.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
      }
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate sitemap" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});