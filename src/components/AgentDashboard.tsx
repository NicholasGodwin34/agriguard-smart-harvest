import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Cloud, Sprout, AlertTriangle, TrendingUp, Activity, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Agent {
  name: string;
  icon: any;
  status: string;
  lastUpdate: string;
  predictions?: number;
  alerts?: number;
  warnings?: number;
  insights?: number;
  reports?: number;
}

export const AgentDashboard = () => {
  const [agents, setAgents] = useState<Agent[]>([
    { name: "Climate Risk Prediction", icon: Cloud, status: "active", lastUpdate: "Loading...", predictions: 0 },
    { name: "Crop Health Monitor", icon: Sprout, status: "active", lastUpdate: "Loading...", alerts: 0 },
    { name: "Post-Harvest Prevention", icon: AlertTriangle, status: "active", lastUpdate: "Loading...", warnings: 0 },
    { name: "Market Intelligence", icon: TrendingUp, status: "active", lastUpdate: "Loading...", insights: 0 },
    { name: "Government Reporting", icon: Activity, status: "active", lastUpdate: "Loading...", reports: 0 },
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadAgentData();
  }, []);

  const loadAgentData = async () => {
    try {
      // Predictions
      const { data: predictions, error: predError } = await supabase
        .from('agent_predictions')
        .select('agent_type, created_at')
        .order('created_at', { ascending: false });

      if (predError) throw predError;

      const climatePreds = predictions?.filter(p => p.agent_type === 'climate').length || 0;
      const marketPreds = predictions?.filter(p => p.agent_type === 'market').length || 0;

      // Alerts
      const { count: alertsCount } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Crop health entries
      const { count: cropHealthCount } = await supabase
        .from('crop_health')
        .select('*', { count: 'exact', head: true });

      setAgents(prev =>
        prev.map(agent => {
          switch (agent.name) {
            case "Climate Risk Prediction":
              return {
                ...agent,
                predictions: climatePreds,
                lastUpdate: predictions?.[0] ? getTimeAgo(predictions[0].created_at) : "No data"
              };

            case "Crop Health Monitor":
              return { ...agent, alerts: cropHealthCount || 0, lastUpdate: getTimeAgo(new Date().toISOString()) };

            case "Market Intelligence":
              return { ...agent, insights: marketPreds, lastUpdate: getTimeAgo(new Date().toISOString()) };

            case "Post-Harvest Prevention":
              return { ...agent, warnings: alertsCount || 0, lastUpdate: getTimeAgo(new Date().toISOString()) };

            default:
              return agent;
          }
        })
      );
    } catch (error) {
      console.error("Error loading agent data:", error);
      toast.error("Failed to load agent data");
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (seconds < 60) return `${seconds} sec ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const runAgent = async (agentType: string) => {
    setIsRefreshing(true);
    try {
      let endpoint = "";
      let payload: any = {};

      switch (agentType) {
        case "climate":
          endpoint = "climate-agent";
          payload = { region: "Central Kenya", requestType: "forecast" };
          break;

        case "crop":
          endpoint = "crop-health-agent";
          payload = { location: "Kiambu County", cropType: "maize" };
          break;

        case "prevention":
          endpoint = "post-harvest-agent";
          payload = { region: "Nakuru Region", cropType: "Maize" };
          break;

        case "market":
          endpoint = "market-intelligence-agent";
          payload = { commodity: "Maize", location: "Nairobi" };
          break;

        case "reporting":
          endpoint = "government-reporting-agent";
          payload = {}; // triggers aggregation
          break;

        default:
          toast.error("Agent type not implemented");
          return;
      }

      const { data, error } = await supabase.functions.invoke(endpoint, { body: payload });
      if (error) throw error;

      toast.success(`${agentType} agent executed successfully`);
      await loadAgentData();
    } catch (error) {
      console.error(`Error running ${agentType} agent:`, error);
      toast.error(`Failed to run ${agentType} agent`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Map card index → agent type
  const agentTypeMap = ["climate", "crop", "prevention", "market", "reporting"];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-foreground">AI Agent Network</h2>
        <Button onClick={loadAgentData} variant="outline" disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent, idx) => {
          const Icon = agent.icon;
          const agentType = agentTypeMap[idx];

          return (
            <Card key={idx} className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-primary">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription className="text-xs">{agent.lastUpdate}</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={agent.status === "active" ? "default" : "secondary"}
                    className={agent.status === "active" ? "bg-success" : ""}
                  >
                    {agent.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  {"predictions" in agent && <span>Predictions: {agent.predictions}</span>}
                  {"alerts" in agent && <span>Alerts: {agent.alerts}</span>}
                  {"warnings" in agent && <span>Warnings: {agent.warnings}</span>}
                  {"insights" in agent && <span>Insights: {agent.insights}</span>}
                  {"reports" in agent && <span>Reports: {agent.reports}</span>}

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => runAgent(agentType)}
                    disabled={isRefreshing}
                  >
                    Run Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
