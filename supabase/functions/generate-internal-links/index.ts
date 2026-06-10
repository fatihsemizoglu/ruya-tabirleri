import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/auth.ts";

serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const { content, currentDreamId, keywords = [] } = await req.json();

    if (!content) {
      return jsonResponse({ error: "Content is required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: dreams, error: dreamsError } = await supabase
      .from("dreams")
      .select("id, title, slug, keywords")
      .eq("is_published", true)
      .neq("id", currentDreamId || "00000000-0000-0000-0000-000000000000")
      .order("view_count", { ascending: false })
      .limit(500);

    if (dreamsError) {
      throw dreamsError;
    }

    const linkSuggestions: Array<{
      dreamId: string;
      title: string;
      slug: string;
      matchType: "title" | "keyword";
      matchedText: string;
      position: number;
    }> = [];

    const contentLower = content.toLowerCase();
    const usedPositions = new Set<number>();

    for (const dream of dreams || []) {
      const titleLower = dream.title.toLowerCase();
      let position = contentLower.indexOf(titleLower);

      if (position !== -1 && !usedPositions.has(position)) {
        const beforeChar = position > 0 ? contentLower[position - 1] : " ";
        const afterChar = position + titleLower.length < contentLower.length
          ? contentLower[position + titleLower.length]
          : " ";

        if (/[\s.,;:!?"'()]/.test(beforeChar) && /[\s.,;:!?"'()]/.test(afterChar)) {
          linkSuggestions.push({
            dreamId: dream.id,
            title: dream.title,
            slug: dream.slug,
            matchType: "title",
            matchedText: content.substring(position, position + dream.title.length),
            position,
          });
          usedPositions.add(position);
        }
      }

      if (dream.keywords && Array.isArray(dream.keywords)) {
        for (const keyword of dream.keywords) {
          if (keyword.length < 3) continue;

          const keywordLower = keyword.toLowerCase();
          position = contentLower.indexOf(keywordLower);

          if (position !== -1 && !usedPositions.has(position)) {
            const beforeChar = position > 0 ? contentLower[position - 1] : " ";
            const afterChar = position + keywordLower.length < contentLower.length
              ? contentLower[position + keywordLower.length]
              : " ";

            if (/[\s.,;:!?"'()]/.test(beforeChar) && /[\s.,;:!?"'()]/.test(afterChar)) {
              linkSuggestions.push({
                dreamId: dream.id,
                title: dream.title,
                slug: dream.slug,
                matchType: "keyword",
                matchedText: content.substring(position, position + keyword.length),
                position,
              });
              usedPositions.add(position);
            }
          }
        }
      }
    }

    const sortedSuggestions = linkSuggestions
      .sort((a, b) => a.position - b.position)
      .slice(0, 10);

    let linkedContent = content;
    const appliedLinks: typeof sortedSuggestions = [];
    const reversedSuggestions = [...sortedSuggestions].sort((a, b) => b.position - a.position);

    for (const suggestion of reversedSuggestions) {
      const linkUrl = `/ruya/${suggestion.slug}`;
      const originalText = linkedContent.substring(
        suggestion.position,
        suggestion.position + suggestion.matchedText.length,
      );
      const linkedText = `[${originalText}](${linkUrl})`;

      linkedContent =
        linkedContent.substring(0, suggestion.position) +
        linkedText +
        linkedContent.substring(suggestion.position + suggestion.matchedText.length);

      appliedLinks.push(suggestion);
    }

    return jsonResponse({
      linkedContent,
      suggestions: sortedSuggestions,
      appliedCount: appliedLinks.length,
    });
  } catch (error) {
    console.error("Error generating internal links:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Internal server error" },
      500,
    );
  }
});
