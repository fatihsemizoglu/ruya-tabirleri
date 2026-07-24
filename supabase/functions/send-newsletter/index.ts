import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/auth.ts";

interface NewsletterRequest {
  postId: string;
  postTitle: string;
  postExcerpt: string;
  postSlug: string;
  postType: 'blog' | 'dream';
  categoryId?: string;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveBaseUrl(req: Request): string {
  return req.headers.get("origin")
    || Deno.env.get("SITE_URL")
    || "https://ruya-tabirleri.vercel.app";
}

async function sendEmail(apiKey: string, params: { from: string; to: string[]; subject: string; html: string }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Resend API error: ${response.status} - ${errorData}`);
  }
  
  return response.json();
}

const handler = async (req: Request): Promise<Response> => {
  const options = handleOptions(req);
  if (options) return options;

  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials are not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { postId, postTitle, postExcerpt, postSlug, postType, categoryId }: NewsletterRequest = await req.json();

    if (!postId || !postTitle || !postSlug) {
      throw new Error("Missing required fields: postId, postTitle, postSlug");
    }

    // Get verified subscribers
    const { data: allSubscribers, error: fetchError } = await supabase
      .from('blog_subscribers')
      .select('email, name, preferred_category_ids')
      .eq('is_verified', true)
      .is('unsubscribed_at', null);

    if (fetchError) {
      throw new Error(`Failed to fetch subscribers: ${fetchError.message}`);
    }

    const subscribers = (allSubscribers || []).filter((subscriber: { preferred_category_ids?: string[] | null }) => {
      const preferences = subscriber.preferred_category_ids || [];
      return !categoryId || preferences.length === 0 || preferences.includes(categoryId);
    });

    if (!subscribers || subscribers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No verified subscribers to notify", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = resolveBaseUrl(req);
    const postUrl = postType === 'blog'
      ? `${baseUrl}/blog/${postSlug}`
      : `${baseUrl}/ruya/${postSlug}`;

    const safeTitle = escapeHtml(postTitle);
    const safeExcerpt = escapeHtml(postExcerpt);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">\u{1F319} R\u00FCya Tabirleri</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="margin-top: 0;">Merhaba,</p>
          <p>Sitemizde yeni bir i\u00E7erik yay\u0131nland\u0131:</p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px;">${safeTitle}</h2>
            ${postExcerpt ? `<p style="margin: 0; color: #6b7280; font-size: 14px;">${safeExcerpt}</p>` : ''}
          </div>
          <a href="${postUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 10px 0;">
            \u0130\u00E7eri\u011Fi Oku \u2192
          </a>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="font-size: 12px; color: #9ca3af; margin-bottom: 0;">
            Bu e-postay\u0131 almak istemiyorsan\u0131z,
            <a href="${baseUrl}/abonelik-iptal?email=%EMAIL%" style="color: #667eea;">aboneli\u011Finizi iptal edebilirsiniz</a>.
          </p>
        </div>
      </body>
      </html>`;

    const BATCH_SIZE = 50;
    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);
      try {
        await sendEmail(RESEND_API_KEY, {
          from: "Rüya Tabirleri <bildirim@ruya-tabirleri.com>",
          to: batch.map((s: { email: string; name?: string | null }) => s.email),
          subject: `Yeni İçerik: ${postTitle}`,
          html: emailHtml,
        });
        successCount += batch.length;
      } catch (emailError) {
        console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed, falling back to individual:`, emailError);
        for (const sub of batch) {
          try {
            await sendEmail(RESEND_API_KEY, {
              from: "Rüya Tabirleri <bildirim@ruya-tabirleri.com>",
              to: [sub.email],
              subject: `Yeni İçerik: ${postTitle}`,
              html: emailHtml.replace('%EMAIL%', encodeURIComponent(sub.email)),
            });
            successCount++;
          } catch (e) {
            errors.push(sub.email);
          }
        }
      }
    }

    console.log(`Newsletter sent: ${successCount}/${subscribers.length} successful`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Bildirim gönderildi`,
        sent: successCount,
        failed: errors.length,
        total: subscribers.length
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in send-newsletter function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
