import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-agriculture.jpg";
import { AgentDashboard } from "@/components/AgentDashboard";
import { AlertsFeed } from "@/components/AlertsFeed";
import { ClimateRiskMap } from "@/components/ClimateRiskMap";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
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

      {/* AI Agents Status */}
      <AgentDashboard />

      {/* Real-time Alerts */}
      <AlertsFeed />

      {/* Climate Risk Dashboard */}
      <ClimateRiskMap />
    </div>
  );
};

export default Index;
