import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { region, cropType, storageType } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // -----------------------------------------------------------
    // 1. Fetch latest climate data for the region
    // -----------------------------------------------------------
    const { data: climate } = await supabase
      .from("climate_data")
      .select("*")
      .eq("region", region)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .single();

    // -----------------------------------------------------------
    // 2. Build Gemini prompt using new workflow structure
    // -----------------------------------------------------------
    const prompt = `
Analyze post-harvest risk for ${cropType} stored using ${storageType} storage in ${region}.

Current Conditions:
- Temperature: ${climate?.temperature}°C
- Humidity: ${climate?.humidity_percent}%

Provide:
1. Spoilage Risk (Low/Medium/High)
2. Estimated Safe Storage Time (days)
3. Specific moisture/pest warnings
4. Logistics recommendation ("Move to cold chain", "Sell immediately", etc.)

Respond ONLY in JSON:
{
  "risk": "High",
  "safe_days": 5,
  "warnings": [],
  "logistics_action": ""
}
`;

    // -----------------------------------------------------------
    // 3. Call Lovable AI (Gemini 2.5 Flash)
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
            { role: "system", content: "You are a post-harvest expert." },
            { role: "user", content: prompt },
          ],
        }),
      }
    );

    const aiData = await aiResponse.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    // -----------------------------------------------------------
    // 4. Store AI prediction into agent_predictions
    // -----------------------------------------------------------
    await supabase.from("agent_predictions").insert({
      agent_type: "post-harvest",
      region: region,
      prediction_data: analysis,
      risk_level: analysis.risk.toLowerCase(),
    });

    // -----------------------------------------------------------
    // 5. Return response to client
    // -----------------------------------------------------------
    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
