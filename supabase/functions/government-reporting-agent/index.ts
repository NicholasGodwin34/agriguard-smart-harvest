import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Gather Intelligence from all other tables
    const { data: alerts } = await supabase.from('alerts').select('*').eq('is_active', true);
    const { data: predictions } = await supabase.from('agent_predictions').select('*').limit(10);
    const { data: market } = await supabase.from('market_prices').select('*').limit(10);

    // 2. Generate Policy Brief using LLM
    const aiPrompt = `Generate a "National Food Security Policy Brief" for the Ministry of Agriculture Kenya.
    
    Current System Data:
    - Active Alerts: ${JSON.stringify(alerts?.length || 0)}
    - Recent Market Trends: ${JSON.stringify(market)}
    - Risk Predictions: ${JSON.stringify(predictions)}
    
    Structure the report as valid JSON:
    {
      "executive_summary": "High level overview...",
      "critical_risks": ["risk 1", "risk 2"],
      "regional_hotspots": [{"region": "name", "issue": "issue"}],
      "recommended_interventions": ["action 1", "action 2"],
      "economic_impact_estimate": "KES Value"
    }`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'system', content: 'You are a senior agricultural policy analyst.' }, { role: 'user', content: aiPrompt }]
      }),
    });

    const aiData = await aiResponse.json();
    const report = JSON.parse(aiData.choices[0].message.content);

    // 3. Store the Report
    await supabase.from('agent_predictions').insert({
      agent_type: 'government_reporting',
      region: 'National',
      prediction_data: report,
      risk_level: alerts?.length && alerts.length > 5 ? 'high' : 'low'
    });

    return new Response(JSON.stringify({ success: true, report }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});