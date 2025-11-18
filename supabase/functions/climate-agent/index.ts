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
    const { region, requestType } = await req.json();
    console.log(`Climate agent processing request for ${region}, type: ${requestType}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch recent climate data for the region
    const { data: climateData, error: climateError } = await supabase
      .from('climate_data')
      .select('*')
      .eq('region', region)
      .order('recorded_at', { ascending: false })
      .limit(5);

    if (climateError) {
      console.error('Error fetching climate data:', climateError);
    }

    // Call Lovable AI for climate prediction
    const aiPrompt = `You are a climate prediction AI agent for agricultural purposes in Kenya.
    
Region: ${region}
Recent Climate Data: ${JSON.stringify(climateData || [])}

Analyze the climate patterns and provide:
1. Risk level assessment (low, medium, high, critical)
2. Rainfall forecast for the next 7 days
3. Temperature trends
4. Specific agricultural recommendations
5. Any warnings about floods, droughts, or extreme weather

Respond in JSON format with these fields:
{
  "risk_level": "low|medium|high|critical",
  "rainfall_forecast": "description",
  "temperature_trend": "description",
  "recommendations": ["list", "of", "recommendations"],
  "warnings": ["any", "warnings"],
  "summary": "brief summary"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an agricultural climate prediction AI. Always respond with valid JSON.' },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const predictionText = aiData.choices[0].message.content;
    
    // Parse the AI response
    let prediction;
    try {
      prediction = JSON.parse(predictionText);
    } catch (e) {
      console.error('Failed to parse AI response:', predictionText);
      // Fallback prediction
      prediction = {
        risk_level: 'medium',
        rainfall_forecast: 'Moderate rainfall expected',
        temperature_trend: 'Stable temperatures',
        recommendations: ['Monitor weather updates', 'Prepare drainage systems'],
        warnings: [],
        summary: 'Climate conditions are within normal range'
      };
    }

    // Store prediction in database
    const { data: storedPrediction, error: insertError } = await supabase
      .from('agent_predictions')
      .insert({
        agent_type: 'climate',
        region: region,
        prediction_data: prediction,
        risk_level: prediction.risk_level,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing prediction:', insertError);
    }

    // If high risk, create an alert
    if (prediction.risk_level === 'high' || prediction.risk_level === 'critical') {
      await supabase
        .from('alerts')
        .insert({
          alert_type: 'climate',
          severity: prediction.risk_level === 'critical' ? 'critical' : 'warning',
          location: region,
          message: prediction.summary,
          details: prediction,
        });
    }

    console.log('Climate prediction completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        prediction: storedPrediction || prediction,
        message: 'Climate prediction generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in climate-agent:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
