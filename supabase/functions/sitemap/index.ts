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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const baseUrl = Deno.env.get("SITE_URL");
    if (!baseUrl) {
      return jsonResponse({ error: "SITE_URL environment variable is required" }, 500);
    }

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

    // Fetch published dreams
    const { data: dreams } = await supabase
      .from("dreams")
      .select("slug, updated_at")
      .eq("is_published", true)
      .order("updated_at", { ascending: false });

    // Fetch published blog posts
    const { data: blogPosts } = await supabase
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("is_published", true)
      .order("updated_at", { ascending: false });

    // Fetch categories
    const { data: categories } = await supabase
      .from("categories")
      .select("slug, updated_at")
      .order("updated_at", { ascending: false });

    // Fetch blog categories
    const { data: blogCategories } = await supabase
      .from("blog_categories")
      .select("slug, updated_at")
      .order("updated_at", { ascending: false });

    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    for (const page of staticPages) {
      xml += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    if (dreams) {
      for (const dream of dreams) {
        const lastmod = new Date(dream.updated_at).toISOString().split("T")[0];
        xml += `  <url>
    <loc>${baseUrl}/ruya/${dream.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
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
  </url>
`;
      }
    }

    if (categories) {
      for (const category of categories) {
        const lastmod = new Date(category.updated_at).toISOString().split("T")[0];
        xml += `  <url>
    <loc>${baseUrl}/kategori/${category.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    }

    if (blogCategories) {
      for (const category of blogCategories) {
        const lastmod = new Date(category.updated_at).toISOString().split("T")[0];
        xml += `  <url>
    <loc>${baseUrl}/blog/etiket/${category.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders(),
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return jsonResponse({ error: "Failed to generate sitemap" }, 500);
  }
});
