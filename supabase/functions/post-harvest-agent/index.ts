import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { region, cropType, storageType, triggerReason } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // -----------------------------------------------------------
    // 1. Fetch climate data safely
    // -----------------------------------------------------------
    const { data: climate, error: climateErr } = await supabase
      .from("climate_data")
      .select("*")
      .eq("region", region)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .single();

    if (climateErr) console.error("Climate fetch error:", climateErr);

    const temperature = climate?.temperature ?? 25;
    const humidity = climate?.humidity_percent ?? 60;

    // -----------------------------------------------------------
    // 2. Build prompt
    // -----------------------------------------------------------
    const prompt = `
Analyze post-harvest risk for ${cropType} in ${storageType} storage at ${region}.
Current Conditions:
- Temperature: ${temperature}°C
- Humidity: ${humidity}%

Respond ONLY in valid JSON:
{
  "risk": "Low|Medium|High",
  "safe_days": number,
  "warnings": ["string"],
  "logistics_action": "string"
}
`;

    // -----------------------------------------------------------
    // 3. AI call with error safety
    // -----------------------------------------------------------
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a post-harvest expert. Always return JSON only." },
            { role: "user", content: prompt },
          ],
        }),
      }
    );

    const aiData = await aiResponse.json();

    const raw = aiData?.choices?.[0]?.message?.content ?? "";
    console.log("Raw AI Output:", raw);

    // -----------------------------------------------------------
    // 4. Safe JSON parsing
    // -----------------------------------------------------------
    let analysis;
    try {
      const clean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
      analysis = JSON.parse(clean);
    } catch (e) {
      console.error("AI JSON parse failed:", e);
      analysis = {
        risk: "Medium",
        safe_days: 7,
        warnings: ["AI parsing failed. Manual inspection recommended."],
        logistics_action: "Keep grain dry; improve aeration.",
      };
    }

    // Ensure mandatory fields exist
    analysis.risk = analysis.risk ?? "Medium";
    analysis.safe_days = analysis.safe_days ?? 7;
    analysis.warnings = analysis.warnings ?? [];
    analysis.logistics_action = analysis.logistics_action ?? "Monitor conditions.";

    // -----------------------------------------------------------
    // 5. Store prediction safely
    // -----------------------------------------------------------
    const { error: insertErr } = await supabase.from("agent_predictions").insert({
      agent_type: "post-harvest",
      region: region ?? "Unknown",
      prediction_data: {
        ...analysis,
        ...(triggerReason ? { triggerReason } : {}),
      },
      risk_level: analysis.risk.toLowerCase(),
    });

    if (insertErr) console.error("DB Insert Error:", insertErr);

    // -----------------------------------------------------------
    // 6. Return result safely
    // -----------------------------------------------------------
    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Fatal Post-Harvest Agent Error:", error);
    return new Response(
      JSON.stringify({ error: error.message ?? "Unknown Server Error" }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
