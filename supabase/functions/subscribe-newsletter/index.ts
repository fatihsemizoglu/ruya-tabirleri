import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleOptions } from "../_shared/cors.ts";

interface SubscribeRequest {
  email: string;
  name?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 80;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeEmail(email: string): string {
  return email.trim().toLocaleLowerCase("tr-TR");
}

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip")
    || "unknown";
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const current = rateLimitBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT_MAX;
}

function resolveBaseUrl(req: Request): string {
  const siteUrl = Deno.env.get("SITE_URL") || "https://ruya-tabirleri.vercel.app";
  const origin = req.headers.get("origin");
  const allowed = Deno.env.get("ALLOWED_ORIGINS")
    ?.split(/[\s,]+/)
    .map((o) => o.trim())
    .filter(Boolean) ?? [];
  return origin && allowed.includes(origin) ? origin : siteUrl;
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

  const origin = req.headers.get("origin");
  const responseHeaders = { ...getCorsHeaders(origin), "Content-Type": "application/json" };

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...responseHeaders, Allow: "POST" },
    });
  }

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

    const { email: rawEmail, name: rawName }: SubscribeRequest = await req.json();
    const email = typeof rawEmail === "string" ? normalizeEmail(rawEmail) : "";
    const name = typeof rawName === "string" ? rawName.trim().slice(0, MAX_NAME_LENGTH) : "";

    if (!email || !EMAIL_RE.test(email)) {
      return new Response(JSON.stringify({ success: false, error: "Geçerli bir e-posta adresi girin" }), {
        status: 400,
        headers: responseHeaders,
      });
    }

    const rateKey = `${getClientIp(req)}:${email}`;
    if (isRateLimited(rateKey)) {
      return new Response(JSON.stringify({ success: false, error: "Çok fazla deneme yapıldı, lütfen daha sonra tekrar deneyin" }), {
        status: 429,
        headers: responseHeaders,
      });
    }

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('blog_subscribers')
      .select('id, is_verified, unsubscribed_at')
      .eq('email', email)
      .single();

    let verificationToken: string;

    if (existing) {
      if (existing.is_verified && !existing.unsubscribed_at) {
        return new Response(
          JSON.stringify({ success: true, message: "Bu e-posta zaten abone listesinde" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Re-subscribe or resend verification
      const { data: updated, error: updateError } = await supabase
        .from('blog_subscribers')
        .update({
          unsubscribed_at: null,
          is_verified: false,
          verification_token: crypto.randomUUID(),
          name: name || null
        })
        .eq('id', existing.id)
        .select('verification_token')
        .single();

      if (updateError) throw new Error(updateError.message);
      verificationToken = updated.verification_token;
    } else {
      // New subscriber
      const { data: newSub, error: insertError } = await supabase
        .from('blog_subscribers')
        .insert({ email, name: name || null })
        .select('verification_token')
        .single();

      if (insertError) throw new Error(insertError.message);
      verificationToken = newSub.verification_token;
    }

    const baseUrl = resolveBaseUrl(req);
    const verifyUrl = `${baseUrl}/abonelik-dogrula?token=${verificationToken}&email=${encodeURIComponent(email)}`;
    const safeName = name ? escapeHtml(name) : "";

    // Send verification email
    await sendEmail(RESEND_API_KEY, {
      from: "Rüya Tabirleri <bildirim@ruya-tabirleri.com>",
      to: [email],
      subject: "E-posta Adresinizi Doğrulayın",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🌙 Rüya Tabirleri</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="margin-top: 0;">Merhaba${safeName ? ` ${safeName}` : ''},</p>
            
            <p>Bülten aboneliğinizi tamamlamak için lütfen aşağıdaki butona tıklayın:</p>
            
            <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
              E-postamı Doğrula ✓
            </a>
            
            <p style="font-size: 14px; color: #6b7280;">
              Bu bağlantı 7 gün boyunca geçerlidir.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #9ca3af; margin-bottom: 0;">
              Bu e-postayı siz talep etmediyseniz, güvenle görmezden gelebilirsiniz.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Doğrulama e-postası gönderildi" }),
      { status: 200, headers: responseHeaders }
    );

  } catch (error: unknown) {
    console.error("Error in subscribe-newsletter function:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Abonelik işlemi tamamlanamadı" }),
      { status: 500, headers: responseHeaders }
    );
  }
};

serve(handler);
