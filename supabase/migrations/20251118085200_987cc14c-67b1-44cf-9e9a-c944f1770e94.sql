-- Create table for AI agent predictions and alerts
CREATE TABLE public.agent_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_type TEXT NOT NULL,
  region TEXT NOT NULL,
  prediction_data JSONB NOT NULL,
  risk_level TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.agent_predictions ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (for demo purposes)
CREATE POLICY "Allow public read access to predictions"
ON public.agent_predictions
FOR SELECT
USING (true);

-- Create policy for service role to insert/update
CREATE POLICY "Allow service role to manage predictions"
ON public.agent_predictions
FOR ALL
USING (auth.role() = 'service_role');

-- Create table for real-time alerts
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  location TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to alerts"
ON public.alerts
FOR SELECT
USING (true);

-- Create policy for service role to manage alerts
CREATE POLICY "Allow service role to manage alerts"
ON public.alerts
FOR ALL
USING (auth.role() = 'service_role');

-- Create table for climate data
CREATE TABLE public.climate_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  region TEXT NOT NULL,
  temperature DECIMAL(5,2),
  rainfall_mm DECIMAL(8,2),
  humidity_percent DECIMAL(5,2),
  wind_speed_kmh DECIMAL(6,2),
  forecast_data JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.climate_data ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to climate data"
ON public.climate_data
FOR SELECT
USING (true);

-- Create policy for service role to insert data
CREATE POLICY "Allow service role to insert climate data"
ON public.climate_data
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Create table for crop health monitoring
CREATE TABLE public.crop_health (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location TEXT NOT NULL,
  crop_type TEXT NOT NULL,
  health_status TEXT NOT NULL,
  disease_detected TEXT,
  pest_detected TEXT,
  confidence_score DECIMAL(3,2),
  image_url TEXT,
  analysis_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.crop_health ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to crop health"
ON public.crop_health
FOR SELECT
USING (true);

-- Create policy for service role to insert data
CREATE POLICY "Allow service role to insert crop health data"
ON public.crop_health
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Create table for market prices
CREATE TABLE public.market_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commodity TEXT NOT NULL,
  market_location TEXT NOT NULL,
  price_per_kg DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  supply_level TEXT,
  demand_level TEXT,
  price_trend TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to market prices"
ON public.market_prices
FOR SELECT
USING (true);

-- Create policy for service role to insert data
CREATE POLICY "Allow service role to insert market prices"
ON public.market_prices
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Create indexes for better query performance
CREATE INDEX idx_agent_predictions_region ON public.agent_predictions(region);
CREATE INDEX idx_agent_predictions_created ON public.agent_predictions(created_at DESC);
CREATE INDEX idx_alerts_location ON public.alerts(location);
CREATE INDEX idx_alerts_created ON public.alerts(created_at DESC);
CREATE INDEX idx_climate_data_region ON public.climate_data(region);
CREATE INDEX idx_climate_data_recorded ON public.climate_data(recorded_at DESC);
CREATE INDEX idx_crop_health_location ON public.crop_health(location);
CREATE INDEX idx_market_prices_commodity ON public.market_prices(commodity);

-- Enable realtime for alerts table
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;

-- Insert some mock data for demonstration
INSERT INTO public.agent_predictions (agent_type, region, prediction_data, risk_level) VALUES
  ('climate', 'Kiambu County', '{"rainfall": "heavy", "flood_risk": "high", "timeframe": "48hrs"}', 'high'),
  ('climate', 'Nakuru Region', '{"rainfall": "moderate", "drought_risk": "low", "timeframe": "7days"}', 'low'),
  ('climate', 'Western Kenya', '{"rainfall": "normal", "risk": "minimal", "timeframe": "14days"}', 'low');

INSERT INTO public.alerts (alert_type, severity, location, message, details) VALUES
  ('climate', 'warning', 'Kiambu County', 'High rainfall expected - flood risk in 48hrs', '{"rainfall_mm": 150, "affected_area_km2": 320}'),
  ('pest', 'critical', 'Nakuru Region', 'Pest outbreak detected in wheat crops', '{"pest_type": "armyworm", "affected_hectares": 45}'),
  ('market', 'info', 'Nairobi Market', 'Maize prices increased by 15% - good selling opportunity', '{"price_change": 15, "commodity": "maize"}');

INSERT INTO public.climate_data (region, temperature, rainfall_mm, humidity_percent, wind_speed_kmh) VALUES
  ('Central Kenya', 22.5, 125.0, 68.0, 12.5),
  ('Rift Valley', 19.2, 180.5, 75.0, 15.8),
  ('Western Kenya', 24.1, 95.0, 62.0, 10.2);

INSERT INTO public.market_prices (commodity, market_location, price_per_kg, supply_level, demand_level, price_trend) VALUES
  ('Maize', 'Nairobi', 45.50, 'medium', 'high', 'increasing'),
  ('Wheat', 'Nakuru', 52.00, 'high', 'medium', 'stable'),
  ('Rice', 'Mombasa', 78.30, 'low', 'high', 'increasing');