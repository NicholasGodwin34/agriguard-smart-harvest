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
    const { location, cropType, imageUrl } = await req.json();
    console.log(`Crop health agent analyzing ${cropType} at ${location}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Prepare AI prompt for crop health analysis
    const aiPrompt = `You are a crop health monitoring AI agent specializing in Kenyan agriculture.

Location: ${location}
Crop Type: ${cropType}
${imageUrl ? `Image provided for analysis` : 'No image provided - provide general assessment'}

Analyze and provide:
1. Overall health status (healthy, stressed, diseased, critical)
2. Potential diseases or issues detected
3. Pest detection if any
4. Confidence score (0.0 to 1.0)
5. Recommended actions

Respond in JSON format:
{
  "health_status": "healthy|stressed|diseased|critical",
  "disease_detected": "name or null",
  "pest_detected": "name or null",
  "confidence_score": 0.85,
  "analysis": "detailed analysis",
  "recommendations": ["action1", "action2"],
  "severity": "low|medium|high"
}`;

    const messages = [
      { role: 'system', content: 'You are an agricultural crop health AI specialist. Always respond with valid JSON.' },
      { role: 'user', content: aiPrompt }
    ];

    // If image URL provided, include it in the analysis
    if (imageUrl) {
      messages.push({
        role: 'user',
        content: `Analyze this crop image: ${imageUrl}`
      } as any);
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        temperature: 0.5,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (e) {
      console.error('Failed to parse AI response:', analysisText);
      analysis = {
        health_status: 'unknown',
        disease_detected: null,
        pest_detected: null,
        confidence_score: 0.5,
        analysis: 'Unable to complete full analysis',
        recommendations: ['Monitor crops regularly', 'Consult with agricultural extension officer'],
        severity: 'low'
      };
    }

    // Store analysis in database
    const { data: storedAnalysis, error: insertError } = await supabase
      .from('crop_health')
      .insert({
        location: location,
        crop_type: cropType,
        health_status: analysis.health_status,
        disease_detected: analysis.disease_detected,
        pest_detected: analysis.pest_detected,
        confidence_score: analysis.confidence_score,
        image_url: imageUrl,
        analysis_data: analysis,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing analysis:', insertError);
    }

    // Create alert if critical condition detected
    if (analysis.severity === 'high' || analysis.health_status === 'critical') {
      await supabase
        .from('alerts')
        .insert({
          alert_type: 'pest',
          severity: analysis.severity === 'high' ? 'warning' : 'critical',
          location: location,
          message: `${analysis.disease_detected || analysis.pest_detected || 'Health issue'} detected in ${cropType}`,
          details: analysis,
        });
    }

    console.log('Crop health analysis completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: storedAnalysis || analysis,
        message: 'Crop health analysis completed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in crop-health-agent:', error);
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
