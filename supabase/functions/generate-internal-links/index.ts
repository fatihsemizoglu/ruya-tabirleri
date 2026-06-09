import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, currentDreamId, keywords = [] } = await req.json();

    if (!content) {
      throw new Error('Content is required');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all published dreams except current one
    const { data: dreams, error: dreamsError } = await supabase
      .from('dreams')
      .select('id, title, slug, keywords')
      .eq('is_published', true)
      .neq('id', currentDreamId || '00000000-0000-0000-0000-000000000000')
      .order('view_count', { ascending: false })
      .limit(500);

    if (dreamsError) {
      throw dreamsError;
    }

    // Find potential link matches
    const linkSuggestions: Array<{
      dreamId: string;
      title: string;
      slug: string;
      matchType: 'title' | 'keyword';
      matchedText: string;
      position: number;
    }> = [];

    const contentLower = content.toLowerCase();
    const usedPositions = new Set<number>();

    for (const dream of dreams || []) {
      // Check if dream title appears in content
      const titleLower = dream.title.toLowerCase();
      let position = contentLower.indexOf(titleLower);
      
      if (position !== -1 && !usedPositions.has(position)) {
        // Verify it's a word boundary match
        const beforeChar = position > 0 ? contentLower[position - 1] : ' ';
        const afterChar = position + titleLower.length < contentLower.length 
          ? contentLower[position + titleLower.length] 
          : ' ';
        
        if (/[\s.,;:!?"'()]/.test(beforeChar) && /[\s.,;:!?"'()]/.test(afterChar)) {
          linkSuggestions.push({
            dreamId: dream.id,
            title: dream.title,
            slug: dream.slug,
            matchType: 'title',
            matchedText: content.substring(position, position + dream.title.length),
            position,
          });
          usedPositions.add(position);
        }
      }

      // Check for keyword matches
      if (dream.keywords && Array.isArray(dream.keywords)) {
        for (const keyword of dream.keywords) {
          if (keyword.length < 3) continue; // Skip very short keywords
          
          const keywordLower = keyword.toLowerCase();
          position = contentLower.indexOf(keywordLower);
          
          if (position !== -1 && !usedPositions.has(position)) {
            const beforeChar = position > 0 ? contentLower[position - 1] : ' ';
            const afterChar = position + keywordLower.length < contentLower.length 
              ? contentLower[position + keywordLower.length] 
              : ' ';
            
            if (/[\s.,;:!?"'()]/.test(beforeChar) && /[\s.,;:!?"'()]/.test(afterChar)) {
              linkSuggestions.push({
                dreamId: dream.id,
                title: dream.title,
                slug: dream.slug,
                matchType: 'keyword',
                matchedText: content.substring(position, position + keyword.length),
                position,
              });
              usedPositions.add(position);
            }
          }
        }
      }
    }

    // Sort by position and limit to prevent over-linking
    const sortedSuggestions = linkSuggestions
      .sort((a, b) => a.position - b.position)
      .slice(0, 10); // Max 10 internal links

    // Generate content with links
    let linkedContent = content;
    const appliedLinks: typeof sortedSuggestions = [];
    
    // Process from end to start to maintain positions
    const reversedSuggestions = [...sortedSuggestions].sort((a, b) => b.position - a.position);
    
    for (const suggestion of reversedSuggestions) {
      const linkUrl = `/ruya/${suggestion.slug}`;
      const originalText = linkedContent.substring(suggestion.position, suggestion.position + suggestion.matchedText.length);
      const linkedText = `[${originalText}](${linkUrl})`;
      
      linkedContent = 
        linkedContent.substring(0, suggestion.position) + 
        linkedText + 
        linkedContent.substring(suggestion.position + suggestion.matchedText.length);
      
      appliedLinks.push(suggestion);
    }

    return new Response(
      JSON.stringify({
        linkedContent,
        suggestions: sortedSuggestions,
        appliedCount: appliedLinks.length,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error generating internal links:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
