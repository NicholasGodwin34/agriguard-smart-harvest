import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClimateDataPoint {
  id: string;
  region: string;
  temperature: number;
  rainfall_mm: number;
  humidity_percent: number;
  recorded_at: string;
}

interface RegionRisk {
  region: string;
  risk: string;
  rainfall: string;
  temp: string;
}

export const ClimateRiskMap = () => {
  const [climateData, setClimateData] = useState<RegionRisk[]>([]);

  useEffect(() => {
    loadClimateData();
  }, []);

  const loadClimateData = async () => {
    try {
      const { data, error } = await supabase
        .from('climate_data')
        .select('*')
        .order('recorded_at', { ascending: false });

      if (error) throw error;

      // Group by region and get latest data
      const regionMap = new Map<string, ClimateDataPoint>();
      data?.forEach((point: ClimateDataPoint) => {
        if (!regionMap.has(point.region)) {
          regionMap.set(point.region, point);
        }
      });

      // Transform to RegionRisk format
      const risks: RegionRisk[] = Array.from(regionMap.values()).map(point => {
        const rainfall = point.rainfall_mm > 150 ? "Heavy Expected" : 
                        point.rainfall_mm > 100 ? "Above Average" : "Normal";
        const risk = point.rainfall_mm > 150 ? "high" : 
                     point.rainfall_mm > 100 ? "medium" : "low";
        
        return {
          region: point.region,
          risk,
          rainfall,
          temp: `${point.temperature}°C`
        };
      });

      setClimateData(risks);
    } catch (error) {
      console.error('Error loading climate data:', error);
      toast.error('Failed to load climate data');
    }
  };

  const getRiskBadge = (risk: string) => {
    if (risk === "high") {
      return <Badge variant="destructive">high risk</Badge>;
    } else if (risk === "medium") {
      return <Badge variant="secondary">medium risk</Badge>;
    } else {
      return <Badge className="bg-success">low risk</Badge>;
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mb-12">
      <h2 className="text-3xl font-bold text-foreground mb-8">Climate Risk Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {climateData.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Loading climate data...
            </CardContent>
          </Card>
        ) : (
          climateData.map((data, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{data.region}</span>
                  {getRiskBadge(data.risk)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rainfall:</span>
                  <span className="font-semibold text-foreground">{data.rainfall}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Temperature:</span>
                  <span className="font-semibold text-foreground">{data.temp}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </section>
  );
};
