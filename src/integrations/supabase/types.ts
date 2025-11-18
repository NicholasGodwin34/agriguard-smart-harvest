export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_predictions: {
        Row: {
          agent_type: string
          created_at: string
          expires_at: string | null
          id: string
          prediction_data: Json
          region: string
          risk_level: string
        }
        Insert: {
          agent_type: string
          created_at?: string
          expires_at?: string | null
          id?: string
          prediction_data: Json
          region: string
          risk_level: string
        }
        Update: {
          agent_type?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          prediction_data?: Json
          region?: string
          risk_level?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          alert_type: string
          created_at: string
          details: Json | null
          id: string
          is_active: boolean
          location: string
          message: string
          resolved_at: string | null
          severity: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          details?: Json | null
          id?: string
          is_active?: boolean
          location: string
          message: string
          resolved_at?: string | null
          severity: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          is_active?: boolean
          location?: string
          message?: string
          resolved_at?: string | null
          severity?: string
        }
        Relationships: []
      }
      climate_data: {
        Row: {
          forecast_data: Json | null
          humidity_percent: number | null
          id: string
          rainfall_mm: number | null
          recorded_at: string
          region: string
          temperature: number | null
          wind_speed_kmh: number | null
        }
        Insert: {
          forecast_data?: Json | null
          humidity_percent?: number | null
          id?: string
          rainfall_mm?: number | null
          recorded_at?: string
          region: string
          temperature?: number | null
          wind_speed_kmh?: number | null
        }
        Update: {
          forecast_data?: Json | null
          humidity_percent?: number | null
          id?: string
          rainfall_mm?: number | null
          recorded_at?: string
          region?: string
          temperature?: number | null
          wind_speed_kmh?: number | null
        }
        Relationships: []
      }
      crop_health: {
        Row: {
          analysis_data: Json | null
          confidence_score: number | null
          created_at: string
          crop_type: string
          disease_detected: string | null
          health_status: string
          id: string
          image_url: string | null
          location: string
          pest_detected: string | null
        }
        Insert: {
          analysis_data?: Json | null
          confidence_score?: number | null
          created_at?: string
          crop_type: string
          disease_detected?: string | null
          health_status: string
          id?: string
          image_url?: string | null
          location: string
          pest_detected?: string | null
        }
        Update: {
          analysis_data?: Json | null
          confidence_score?: number | null
          created_at?: string
          crop_type?: string
          disease_detected?: string | null
          health_status?: string
          id?: string
          image_url?: string | null
          location?: string
          pest_detected?: string | null
        }
        Relationships: []
      }
      market_prices: {
        Row: {
          commodity: string
          currency: string
          demand_level: string | null
          id: string
          market_location: string
          price_per_kg: number
          price_trend: string | null
          recorded_at: string
          supply_level: string | null
        }
        Insert: {
          commodity: string
          currency?: string
          demand_level?: string | null
          id?: string
          market_location: string
          price_per_kg: number
          price_trend?: string | null
          recorded_at?: string
          supply_level?: string | null
        }
        Update: {
          commodity?: string
          currency?: string
          demand_level?: string | null
          id?: string
          market_location?: string
          price_per_kg?: number
          price_trend?: string | null
          recorded_at?: string
          supply_level?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
