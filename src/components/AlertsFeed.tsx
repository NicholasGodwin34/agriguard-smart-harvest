import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  location: string;
  message: string;
  created_at: string;
}

export const AlertsFeed = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    loadAlerts();
    
    // Subscribe to real-time alerts
    const channel = supabase
      .channel('alerts-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts'
        },
        (payload) => {
          console.log('New alert received:', payload);
          setAlerts(prev => [payload.new as Alert, ...prev]);
          toast.info('New alert received!');
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
        .from('alerts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast.error('Failed to load alerts');
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-l-destructive';
      case 'warning':
        return 'border-l-warning';
      default:
        return 'border-l-primary';
    }
  };

  const getSeverityIconColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-destructive';
      case 'warning':
        return 'text-warning';
      default:
        return 'text-primary';
    }
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
          alerts.map((alert) => (
            <Card 
              key={alert.id} 
              className={`border-l-4 ${getSeverityColor(alert.severity)}`}
            >
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <AlertTriangle 
                    className={`w-6 h-6 ${getSeverityIconColor(alert.severity)}`} 
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">{alert.location}</span>
                    </div>
                    <p className="text-foreground">{alert.message}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getTimeAgo(alert.created_at)}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">View Details</Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </section>
  );
};
