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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // -----------------------------------------------------------
    // 1. Gather intelligence from internal system tables
    // -----------------------------------------------------------
    const { data: alerts } = await supabase
      .from("alerts")
      .select("*")
      .eq("is_active", true);

    const { data: predictions } = await supabase
      .from("agent_predictions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: market } = await supabase
      .from("market_prices")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    const activeAlertCount = alerts?.length ?? 0;
    const criticalAlerts =
      alerts?.filter((a) => a.severity === "critical") ?? [];

    // -----------------------------------------------------------
    // 2. Build the policy brief AI prompt
    // -----------------------------------------------------------
    const aiPrompt = `
Generate a "National Food Security Policy Brief" for the Ministry of Agriculture, Kenya.

Use the following system data:

Active Alerts: ${activeAlertCount}
Critical Alerts: ${criticalAlerts.length}
Market Prices: ${JSON.stringify(market)}
Predictive Analytics: ${JSON.stringify(predictions)}

Structure the result strictly as valid JSON:
{
  "executive_summary": "",
  "critical_risks": [],
  "regional_hotspots": [],
  "recommended_interventions": [],
  "economic_impact_estimate": ""
}
`;

    // -----------------------------------------------------------
    // 3. Call Gemini via Lovable AI Gateway
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
            { role: "system", content: "You are a senior agricultural policy analyst." },
            { role: "user", content: aiPrompt },
          ],
        }),
      }
    );

    const aiData = await aiResponse.json();
    const report = JSON.parse(aiData.choices[0].message.content);

    // -----------------------------------------------------------
    // 4. Store final policy brief
    // -----------------------------------------------------------
    await supabase.from("agent_predictions").insert({
      agent_type: "government_reporting",
      region: "National",
      prediction_data: report,
      risk_level: activeAlertCount > 5 ? "high" : "low",
    });

    // -----------------------------------------------------------
    // 5. Return final JSON response
    // -----------------------------------------------------------
    return new Response(JSON.stringify({ success: true, report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
