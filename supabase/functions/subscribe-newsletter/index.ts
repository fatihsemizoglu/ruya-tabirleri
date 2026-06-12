import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SubscribeRequest {
  email: string;
  name?: string;
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    const { email, name }: SubscribeRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
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

    const baseUrl = req.headers.get("origin")
      || Deno.env.get("SITE_URL")
      || "https://ruya-tabirleri.vercel.app";
    const verifyUrl = `${baseUrl}/abonelik-dogrula?token=${verificationToken}&email=${encodeURIComponent(email)}`;

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
            <p style="margin-top: 0;">Merhaba${name ? ` ${name}` : ''},</p>
            
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
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in subscribe-newsletter function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
