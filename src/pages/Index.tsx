import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-agriculture.jpg";

import { AgentDashboard } from "@/components/AgentDashboard";
import { AlertsFeed } from "@/components/AlertsFeed";
import { ClimateRiskMap } from "@/components/ClimateRiskMap";
import { FarmerChat } from "@/components/FarmerChat";

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Utility function for timestamp
const newLxDate = () => new Date();

const Index = () => {

  const simulateDisaster = async () => {
    toast.loading("Simulating Flash Flood Event...");

    // 1. Insert extreme climate event
    await supabase.from("climate_data").insert({
      region: "Kiambu County",
      temperature: 18.5,
      rainfall_mm: 200.0,  // Flash flood-level rainfall
      recorded_at: newLxDate().toISOString(),
    });

    // 2. Insert critical alert
    await supabase.from("alerts").insert({
      alert_type: "climate",
      severity: "critical",
      location: "Kiambu County",
      message: "CRITICAL: Flash flood warning. 200mm rainfall detected.",
      is_active: true,
    });

    toast.dismiss();
    toast.error("Critical Flood Alert Generated!");
  };

  return (
    <div className="min-h-screen bg-gradient-hero relative">

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <Badge className="mb-4 bg-primary text-primary-foreground">
              Powered by AI Multi-Agent System
            </Badge>

            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              AgriGuard
            </h1>

            <p className="text-2xl text-muted-foreground mb-4">
              AI-powered early warnings for a food-secure Kenya
            </p>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Predictive analytics and real-time alerts for farmers, cooperatives,
              and government agencies. Preventing post-harvest losses through
              intelligent monitoring and climate-resilient decision making.
            </p>

            <div className="flex gap-4 justify-center">
              <Button size="lg" className="bg-gradient-primary">
                Access Dashboard
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* AI Agent Status */}
      <AgentDashboard />

      {/* Alerts Feed */}
      <AlertsFeed />

      {/* Climate Risk Map */}
      <ClimateRiskMap />

      {/* Floating Simulation Button (Demo Only) */}
      <div className="fixed bottom-4 left-4 z-50">
        <Button variant="destructive" onClick={simulateDisaster}>
          Simulate Flood
        </Button>
      </div>

      {/* Farmer Chat Widget */}
      <FarmerChat />
    </div>
  );
};

export default Index;
