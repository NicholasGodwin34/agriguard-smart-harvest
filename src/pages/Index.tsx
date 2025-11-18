import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-agriculture.jpg";
import { AgentDashboard } from "@/components/AgentDashboard";
import { AlertsFeed } from "@/components/AlertsFeed";
import { ClimateRiskMap } from "@/components/ClimateRiskMap";
// Import the components we created in the previous step
import { FarmerChat } from "@/components/FarmerChat"; 
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  
  // Helper for smooth scrolling
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Simulation function (from previous advice)
  const simulateDisaster = async () => {
    toast.error("⚠️ CRITICAL ALERT: Flash Flood Detected in Kiambu Region!", {
        description: "300mm rainfall expected in next 4 hours. Immediate harvest recommended.",
        duration: 8000,
    });
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
              Predictive analytics and real-time alerts for farmers, cooperatives, and government agencies.
              Preventing post-harvest losses through intelligent monitoring and climate-resilient decision making.
            </p>
            <div className="flex gap-4 justify-center">
              {/* UPDATED BUTTONS HERE */}
              <Button 
                size="lg" 
                className="bg-gradient-primary"
                onClick={() => scrollToSection('agent-dashboard')}
              >
                Access Dashboard
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => scrollToSection('risk-map')}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* AI Agents Status - Wrapped with ID */}
      <div id="agent-dashboard">
        <AgentDashboard />
      </div>

      {/* Real-time Alerts */}
      <AlertsFeed />

      {/* Climate Risk Dashboard - Wrapped with ID for 'Learn More' */}
      <div id="risk-map">
        <ClimateRiskMap />
      </div>

      {/* Simulation Controls (God Mode) */}
      <div className="fixed bottom-4 left-4 z-50">
        <Button variant="destructive" onClick={simulateDisaster}>
          ⚡ Simulate Flood Event
        </Button>
      </div>

      {/* Farmer Chat Interface */}
      <FarmerChat />
    </div>
  );
};

export default Index;