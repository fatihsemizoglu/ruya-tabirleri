import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { requireCronSecret } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  const cronError = requireCronSecret(req);
  if (cronError) return cronError;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayName = dayNames[now.getDay()];
    const currentTime = now.toTimeString().slice(0, 5);

    const { data: prefs, error: prefsError } = await supabase
      .from("user_reminder_prefs")
      .select("user_id, preferred_time, preferred_days, streak_count, last_reminder_sent")
      .eq("is_enabled", true);

    if (prefsError) throw prefsError;
    if (!prefs || prefs.length === 0) {
      return jsonResponse({ success: true, reminders_sent: 0 });
    }

    let sentCount = 0;

    for (const pref of prefs) {
      if (!pref.preferred_days?.includes(todayName)) continue;
      if (pref.preferred_time && pref.preferred_time.slice(0, 5) !== currentTime) continue;
      if (pref.last_reminder_sent && pref.last_reminder_sent.slice(0, 10) === today) continue;

      const { data: recentDreams, error: countError } = await supabase
        .from("dream_journal")
        .select("id", { count: "exact" })
        .eq("user_id", pref.user_id)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (countError) continue;

      await supabase.from("user_reminder_prefs").update({
        last_reminder_sent: now.toISOString(),
        avg_dreams_per_week: Math.round(((recentDreams?.length || 0) / 7) * 10) / 10,
        most_active_day: todayName,
      }).eq("user_id", pref.user_id);

      console.log(`Reminder sent to user ${pref.user_id} (streak: ${pref.streak_count})`);
      sentCount++;
    }

    return jsonResponse({
      success: true,
      reminders_sent: sentCount,
      checked_users: prefs.length,
    });
  } catch (error) {
    console.error("dream-reminder error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
