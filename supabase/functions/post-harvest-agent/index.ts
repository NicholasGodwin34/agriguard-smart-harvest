import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { region, cropType } = await req.json();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get recent climate data for storage conditions
    const { data: climate } = await supabase.from('climate_data').select('*').eq('region', region).order('recorded_at', { ascending: false }).limit(1).single();

    const aiPrompt = `Analyze post-harvest loss risk.
    Region: ${region}
    Crop: ${cropType}
    Current Weather: Humidity ${climate?.humidity_percent}%, Temp ${climate?.temperature}C
    
    Determine risk of aflatoxin, pests, or rot in storage.
    Respond in JSON:
    {
      "risk_level": "low|medium|high",
      "threat_type": "Aflatoxin|Weevils|Rot",
      "immediate_action": "Dry immediately|Fumigate|Sell now",
      "storage_advice": "detailed advice"
    }`;

    constAiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'system', content: 'You are a post-harvest loss prevention specialist.' }, { role: 'user', content: aiPrompt }]
      }),
    });

    const aiData = await aiResponse.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    // If risk is high, trigger an ALERT
    if (analysis.risk_level === 'high') {
      await supabase.from('alerts').insert({
        alert_type: 'post_harvest',
        severity: 'warning',
        location: region,
        message: `Post-Harvest Risk: ${analysis.threat_type} detected for ${cropType}`,
        details: analysis
      });
    }

    return new Response(JSON.stringify({ success: true, analysis }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});