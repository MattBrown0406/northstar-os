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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      baseline_audits: {
        Row: {
          completed_at: string | null
          created_at: string
          current_question: number | null
          current_section: number | null
          id: string
          responses: Json | null
          scores: Json | null
          status: Database["public"]["Enums"]["audit_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_question?: number | null
          current_section?: number | null
          id?: string
          responses?: Json | null
          scores?: Json | null
          status?: Database["public"]["Enums"]["audit_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_question?: number | null
          current_section?: number | null
          id?: string
          responses?: Json | null
          scores?: Json | null
          status?: Database["public"]["Enums"]["audit_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      check_ins: {
        Row: {
          ai_response: Json | null
          blockers: string[] | null
          commitments: string[] | null
          created_at: string
          drift_detected: boolean | null
          energy_score: number | null
          id: string
          mood_score: number | null
          user_id: string
          wins: string[] | null
        }
        Insert: {
          ai_response?: Json | null
          blockers?: string[] | null
          commitments?: string[] | null
          created_at?: string
          drift_detected?: boolean | null
          energy_score?: number | null
          id?: string
          mood_score?: number | null
          user_id: string
          wins?: string[] | null
        }
        Update: {
          ai_response?: Json | null
          blockers?: string[] | null
          commitments?: string[] | null
          created_at?: string
          drift_detected?: boolean | null
          energy_score?: number | null
          id?: string
          mood_score?: number | null
          user_id?: string
          wins?: string[] | null
        }
        Relationships: []
      }
      coach_branding: {
        Row: {
          brand_foreground: string | null
          brand_primary: string | null
          brand_secondary: string | null
          coach_user_id: string
          company_name: string | null
          created_at: string
          headshot_url: string | null
          id: string
          logo_url: string | null
          slug: string
          tagline: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          brand_foreground?: string | null
          brand_primary?: string | null
          brand_secondary?: string | null
          coach_user_id: string
          company_name?: string | null
          created_at?: string
          headshot_url?: string | null
          id?: string
          logo_url?: string | null
          slug: string
          tagline?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          brand_foreground?: string | null
          brand_primary?: string | null
          brand_secondary?: string | null
          coach_user_id?: string
          company_name?: string | null
          created_at?: string
          headshot_url?: string | null
          id?: string
          logo_url?: string | null
          slug?: string
          tagline?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      coach_clients: {
        Row: {
          assigned_tier: Database["public"]["Enums"]["plan_tier"]
          client_user_id: string
          coach_user_id: string
          created_at: string
          id: string
        }
        Insert: {
          assigned_tier?: Database["public"]["Enums"]["plan_tier"]
          client_user_id: string
          coach_user_id: string
          created_at?: string
          id?: string
        }
        Update: {
          assigned_tier?: Database["public"]["Enums"]["plan_tier"]
          client_user_id?: string
          coach_user_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      coach_invite_links: {
        Row: {
          assigned_tier: Database["public"]["Enums"]["plan_tier"]
          coach_user_id: string
          created_at: string
          id: string
          invite_code: string
          is_active: boolean
          label: string | null
          uses_count: number
        }
        Insert: {
          assigned_tier?: Database["public"]["Enums"]["plan_tier"]
          coach_user_id: string
          created_at?: string
          id?: string
          invite_code?: string
          is_active?: boolean
          label?: string | null
          uses_count?: number
        }
        Update: {
          assigned_tier?: Database["public"]["Enums"]["plan_tier"]
          coach_user_id?: string
          created_at?: string
          id?: string
          invite_code?: string
          is_active?: boolean
          label?: string | null
          uses_count?: number
        }
        Relationships: []
      }
      commitment_callbacks: {
        Row: {
          check_in_id: string
          created_at: string | null
          id: string
          outcome: string
          previous_commitment_id: string | null
          previous_commitment_text: string | null
          user_id: string
        }
        Insert: {
          check_in_id: string
          created_at?: string | null
          id?: string
          outcome: string
          previous_commitment_id?: string | null
          previous_commitment_text?: string | null
          user_id: string
        }
        Update: {
          check_in_id?: string
          created_at?: string | null
          id?: string
          outcome?: string
          previous_commitment_id?: string | null
          previous_commitment_text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commitment_callbacks_previous_commitment_id_fkey"
            columns: ["previous_commitment_id"]
            isOneToOne: false
            referencedRelation: "weekly_commitments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          check_in_cadence:
            | Database["public"]["Enums"]["check_in_cadence"]
            | null
          coaching_tone: Database["public"]["Enums"]["coaching_tone"] | null
          created_at: string
          display_name: string | null
          id: string
          is_active: boolean
          onboarding_completed: boolean | null
          plan_tier: Database["public"]["Enums"]["plan_tier"] | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in_cadence?:
            | Database["public"]["Enums"]["check_in_cadence"]
            | null
          coaching_tone?: Database["public"]["Enums"]["coaching_tone"] | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          onboarding_completed?: boolean | null
          plan_tier?: Database["public"]["Enums"]["plan_tier"] | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in_cadence?:
            | Database["public"]["Enums"]["check_in_cadence"]
            | null
          coaching_tone?: Database["public"]["Enums"]["coaching_tone"] | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          onboarding_completed?: boolean | null
          plan_tier?: Database["public"]["Enums"]["plan_tier"] | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      strategic_reports: {
        Row: {
          audit_id: string | null
          contradictions: Json | null
          created_at: string
          forced_choice: string | null
          id: string
          ninety_day_plan: Json | null
          north_star_focus: string | null
          pattern_analysis: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audit_id?: string | null
          contradictions?: Json | null
          created_at?: string
          forced_choice?: string | null
          id?: string
          ninety_day_plan?: Json | null
          north_star_focus?: string | null
          pattern_analysis?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audit_id?: string | null
          contradictions?: Json | null
          created_at?: string
          forced_choice?: string | null
          id?: string
          ninety_day_plan?: Json | null
          north_star_focus?: string | null
          pattern_analysis?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategic_reports_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "baseline_audits"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_commitments: {
        Row: {
          commitment: string
          completed_at: string | null
          created_at: string | null
          id: string
          outcome: string | null
          reflection: string | null
          user_id: string
          week_start: string
        }
        Insert: {
          commitment: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          outcome?: string | null
          reflection?: string | null
          user_id: string
          week_start: string
        }
        Update: {
          commitment?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          outcome?: string | null
          reflection?: string | null
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_client_of: {
        Args: { _client_id: string; _coach_id: string }
        Returns: boolean
      }
      is_coach: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      audit_status: "in_progress" | "completed"
      check_in_cadence: "daily" | "every_other_day" | "weekly"
      coaching_tone: "direct" | "supportive" | "balanced"
      plan_tier: "free" | "pro" | "premium" | "coach"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      audit_status: ["in_progress", "completed"],
      check_in_cadence: ["daily", "every_other_day", "weekly"],
      coaching_tone: ["direct", "supportive", "balanced"],
      plan_tier: ["free", "pro", "premium", "coach"],
    },
  },
} as const
