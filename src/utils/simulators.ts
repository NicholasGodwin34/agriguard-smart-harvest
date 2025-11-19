import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const startSatelliteStream = async (region: string, onUpdate: (data: any) => void) => {
  toast.info("🛰️ Satellite connection established. Receiving live telemetry...");

  // Simulate a live stream with an interval
  const intervalId = setInterval(async () => {
    // Generate realistic fluctuations
    const temp = 22 + (Math.random() * 4 - 2); // 20-24°C
    const humidity = 65 + (Math.random() * 10 - 5); // 60-70%
    const rain = Math.random() > 0.8 ? Math.random() * 5 : 0; // Occasional rain

    // Insert into database
    const { data, error } = await supabase
      .from('climate_data')
      .insert({
        region: region,
        temperature: parseFloat(temp.toFixed(1)),
        humidity_percent: parseFloat(humidity.toFixed(1)),
        rainfall_mm: parseFloat(rain.toFixed(1)),
        recorded_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Satellite data error:", error);
    } else {
      onUpdate(data);
      // 10% chance to trigger a "High Rainfall" anomaly for the demo
      if (Math.random() > 0.9) {
        triggerAnomaly(region);
      }
    }
  }, 5000); // Update every 5 seconds

  return intervalId; // Return ID so we can stop it later
};

const triggerAnomaly = async (region: string) => {
  toast.warning(`⚠️ Anomaly Detected in ${region}: Sudden Rainfall Spike`);
  // This could automatically trigger the Climate Agent in a real system
};