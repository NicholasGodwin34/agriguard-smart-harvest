import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, MapPin, Info, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  location: string;
  message: string;
  created_at: string;
  details: Record<string, any> | null;
}

export const AlertsFeed = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  useEffect(() => {
    loadAlerts();

    const channel = supabase
      .channel("alerts-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts" },
        (payload) => {
          setAlerts((prev) => [payload.new as Alert, ...prev]);
          toast.info("New alert received!");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error("Error loading alerts:", error);
      toast.error("Failed to load alerts");
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

  const getSeverityStyles = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return {
          border: "border-l-destructive",
          icon: "text-destructive",
          badge: "destructive" as const,
        };
      case "warning":
        return {
          border: "border-l-yellow-500",
          icon: "text-yellow-500",
          badge: "secondary" as const,
        };
      default:
        return {
          border: "border-l-primary",
          icon: "text-primary",
          badge: "default" as const,
        };
    }
  };

  const renderDetails = (details: Record<string, any> | null) => {
    if (!details)
      return <p className="text-muted-foreground">No additional details available.</p>;

    return (
      <div className="grid gap-2">
        {Object.entries(details).map(([key, value]) => (
          <div
            key={key}
            className="grid grid-cols-3 gap-4 border-b pb-2 last:border-0"
          >
            <span className="font-medium capitalize text-muted-foreground">
              {key.replace(/_/g, " ")}
            </span>
            <span className="col-span-2 font-semibold text-foreground">
              {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-bold text-foreground mb-8">Recent Alerts</h2>

      <div className="space-y-4">
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No active alerts at this time
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => {
            const styles = getSeverityStyles(alert.severity);

            return (
              <Card key={alert.id} className={`border-l-4 ${styles.border}`}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold text-foreground">
                          {alert.location}
                        </span>

                        <Badge variant="outline" className="capitalize">
                          {alert.alert_type}
                        </Badge>
                      </div>

                      <p className="text-foreground font-medium">{alert.message}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getTimeAgo(alert.created_at)}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAlert(alert)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* DETAILS MODAL */}
      <Dialog open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              {selectedAlert?.severity === "critical" ? (
                <XCircle className="text-destructive w-6 h-6" />
              ) : selectedAlert?.severity === "warning" ? (
                <AlertTriangle className="text-yellow-500 w-6 h-6" />
              ) : (
                <Info className="text-primary w-6 h-6" />
              )}

              <Badge
                variant={
                  selectedAlert
                    ? getSeverityStyles(selectedAlert.severity).badge
                    : "default"
                }
                className="uppercase"
              >
                {selectedAlert?.severity}
              </Badge>
            </div>

            <DialogTitle className="text-xl">{selectedAlert?.message}</DialogTitle>

            <DialogDescription className="flex items-center gap-1 pt-1">
              <MapPin className="w-3 h-3" />
              {selectedAlert?.location} •{" "}
              {selectedAlert &&
                new Date(selectedAlert.created_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">
              Analysis Details
            </h4>

            <ScrollArea className="h-[220px] w-full rounded-md border p-4 bg-muted/20">
              {selectedAlert && renderDetails(selectedAlert.details)}
            </ScrollArea>
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="secondary" onClick={() => setSelectedAlert(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};
