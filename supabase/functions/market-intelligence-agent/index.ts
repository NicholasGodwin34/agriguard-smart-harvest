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
    const { commodity, location } = await req.json();
    console.log(`Market intelligence agent analyzing ${commodity} at ${location}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch recent market data
    const { data: marketData, error: marketError } = await supabase
      .from('market_prices')
      .select('*')
      .eq('commodity', commodity)
      .order('recorded_at', { ascending: false })
      .limit(10);

    if (marketError) {
      console.error('Error fetching market data:', marketError);
    }

    const aiPrompt = `You are a market intelligence AI agent for agricultural commodities in Kenya.

Commodity: ${commodity}
Location: ${location}
Recent Price Data: ${JSON.stringify(marketData || [])}

Analyze and provide:
1. Current market trend (increasing, stable, decreasing)
2. Price prediction for next 7 days
3. Best selling timing recommendation
4. Supply and demand analysis
5. Market opportunities

Respond in JSON format:
{
  "trend": "increasing|stable|decreasing",
  "price_prediction": "description",
  "best_selling_time": "timing recommendation",
  "supply_analysis": "current supply situation",
  "demand_analysis": "current demand situation",
  "opportunities": ["opportunity1", "opportunity2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "confidence": 0.85
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
          { role: 'system', content: 'You are a market intelligence AI for agriculture. Always respond with valid JSON.' },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.6,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const intelligenceText = aiData.choices[0].message.content;
    
    let intelligence;
    try {
      intelligence = JSON.parse(intelligenceText);
    } catch (e) {
      console.error('Failed to parse AI response:', intelligenceText);
      intelligence = {
        trend: 'stable',
        price_prediction: 'Prices expected to remain stable',
        best_selling_time: 'Monitor market for optimal timing',
        supply_analysis: 'Current supply levels moderate',
        demand_analysis: 'Demand is consistent',
        opportunities: ['Regular market monitoring recommended'],
        recommendations: ['Track price changes', 'Consider storage options'],
        confidence: 0.6
      };
    }

    // Store intelligence in database as a prediction
    const { data: storedIntel, error: insertError } = await supabase
      .from('agent_predictions')
      .insert({
        agent_type: 'market',
        region: location,
        prediction_data: { commodity, ...intelligence },
        risk_level: intelligence.trend === 'decreasing' ? 'medium' : 'low',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing intelligence:', insertError);
    }

    // Create alert if significant opportunity or risk
    if (intelligence.trend === 'increasing' && intelligence.confidence > 0.7) {
      await supabase
        .from('alerts')
        .insert({
          alert_type: 'market',
          severity: 'info',
          location: location,
          message: `${commodity} prices trending up - good selling opportunity`,
          details: intelligence,
        });
    }

    console.log('Market intelligence analysis completed');

    return new Response(
      JSON.stringify({ 
        success: true, 
        intelligence: storedIntel || intelligence,
        message: 'Market intelligence generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in market-intelligence-agent:', error);
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
