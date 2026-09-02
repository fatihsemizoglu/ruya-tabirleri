import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleOptions, jsonResponse } from "../_shared/cors.ts";
import { requireCronSecret } from "../_shared/auth.ts";

const PAGE_SIZE = 1000;

type QueryBuilder = {
  eq: (column: string, value: unknown) => QueryBuilder;
  order: (column: string, options: { ascending: boolean }) => QueryBuilder;
  range: (from: number, to: number) => Promise<{ data: unknown[] | null; error: Error | null }>;
};

type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => QueryBuilder;
  };
};

async function fetchAllRows<T>(
  supabase: SupabaseLike,
  table: string,
  select: string,
  configure: (query: QueryBuilder) => QueryBuilder,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1;
    const query = supabase.from(table).select(select).order("updated_at", { ascending: false });
    const { data, error } = await configure(query).range(from, to);
    if (error) throw error;
    rows.push(...((data || []) as T[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

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
      { url: "/sss", priority: "0.6", changefreq: "weekly" },
      { url: "/iletisim", priority: "0.8", changefreq: "monthly" },
      { url: "/blog", priority: "0.9", changefreq: "daily" },
      { url: "/kategoriler", priority: "0.9", changefreq: "weekly" },
      { url: "/populer", priority: "0.8", changefreq: "daily" },
      // Not: /ara arama sonuç sayfası olduğu için sitemap'e dahil edilmez (noindex pratiği).
      { url: "/az", priority: "0.8", changefreq: "weekly" },
      { url: "/semboller", priority: "0.8", changefreq: "weekly" },
      { url: "/ruyami-yorumlat", priority: "0.9", changefreq: "weekly" },
      { url: "/istatistikler", priority: "0.7", changefreq: "daily" },
      { url: "/gizlilik", priority: "0.3", changefreq: "yearly" },
      { url: "/kullanim-kosullari", priority: "0.3", changefreq: "yearly" },
      { url: "/kvkk", priority: "0.3", changefreq: "yearly" },
      { url: "/cerez-politikasi", priority: "0.3", changefreq: "yearly" },
    ];

    const [dreams, blogPosts, categories, blogCategories] = await Promise.all([
      fetchAllRows<{ slug: string; updated_at: string }>(supabase, "dreams", "slug, updated_at", (query) => query.eq("is_published", true)),
      fetchAllRows<{ slug: string; updated_at: string }>(supabase, "blog_posts", "slug, updated_at", (query) => query.eq("is_published", true)),
      fetchAllRows<{ slug: string; updated_at: string }>(supabase, "categories", "slug, updated_at", (query) => query),
      fetchAllRows<{ slug: string; updated_at: string }>(supabase, "blog_categories", "slug, updated_at", (query) => query),
    ]);

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
        ...getCorsHeaders(req.headers.get("origin")),
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return jsonResponse({ error: "Failed to generate sitemap" }, 500);
  }
});
