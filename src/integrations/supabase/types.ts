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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          shop_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          shop_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          shop_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          shop_id: string | null
          user_id: string
        }
        Insert: {
          address?: string
          created_at?: string
          email?: string
          id?: string
          name: string
          phone: string
          shop_id?: string | null
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          shop_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_photos: {
        Row: {
          created_at: string
          id: string
          inspection_id: string
          label: string
          photo_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          inspection_id: string
          label?: string
          photo_url: string
        }
        Update: {
          created_at?: string
          id?: string
          inspection_id?: string
          label?: string
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_photos_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          created_at: string
          id: string
          method: string
          paid_amount: number
          remaining_amount: number
          reminder_date: string | null
          service_id: string
          shop_id: string | null
          status: string
          total_amount: number
        }
        Insert: {
          created_at?: string
          id?: string
          method?: string
          paid_amount?: number
          remaining_amount?: number
          reminder_date?: string | null
          service_id: string
          shop_id?: string | null
          status?: string
          total_amount?: number
        }
        Update: {
          created_at?: string
          id?: string
          method?: string
          paid_amount?: number
          remaining_amount?: number
          reminder_date?: string | null
          service_id?: string
          shop_id?: string | null
          status?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_parts: {
        Row: {
          id: string
          image_url: string | null
          name: string
          price: number
          quote_id: string
        }
        Insert: {
          id?: string
          image_url?: string | null
          name: string
          price?: number
          quote_id: string
        }
        Update: {
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          quote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_parts_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          client_id: string
          created_at: string
          id: string
          labor_cost: number
          observations: string
          parts_markup: number
          parts_total: number
          shop_id: string | null
          status: string
          total: number
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          labor_cost?: number
          observations?: string
          parts_markup?: number
          parts_total?: number
          shop_id?: string | null
          status?: string
          total?: number
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          labor_cost?: number
          observations?: string
          parts_markup?: number
          parts_total?: number
          shop_id?: string | null
          status?: string
          total?: number
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          client_id: string
          completed_at: string | null
          deadline: string | null
          id: string
          quote_id: string
          scheduled_date: string | null
          shop_id: string | null
          started_at: string
          status: string
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          deadline?: string | null
          id?: string
          quote_id: string
          scheduled_date?: string | null
          shop_id?: string | null
          started_at?: string
          status?: string
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          deadline?: string | null
          id?: string
          quote_id?: string
          scheduled_date?: string | null
          shop_id?: string | null
          started_at?: string
          status?: string
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: true
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_users: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["shop_role"]
          shop_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["shop_role"]
          shop_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["shop_role"]
          shop_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_users_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          active: boolean
          address: string
          created_at: string
          email: string
          id: string
          logo_url: string | null
          name: string
          phone: string
          primary_color: string
          whatsapp: string
        }
        Insert: {
          active?: boolean
          address?: string
          created_at?: string
          email?: string
          id?: string
          logo_url?: string | null
          name: string
          phone?: string
          primary_color?: string
          whatsapp?: string
        }
        Update: {
          active?: boolean
          address?: string
          created_at?: string
          email?: string
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string
          primary_color?: string
          whatsapp?: string
        }
        Relationships: []
      }
      system_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["system_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["system_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["system_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_inspections: {
        Row: {
          created_at: string
          id: string
          inspection_date: string
          inspector_user_id: string | null
          notes: string
          service_id: string
          shop_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inspection_date?: string
          inspector_user_id?: string | null
          notes?: string
          service_id: string
          shop_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inspection_date?: string
          inspector_user_id?: string | null
          notes?: string
          service_id?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_inspections_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_inspections_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string
          client_id: string
          created_at: string
          id: string
          model: string
          observations: string
          plate: string
          year: string
        }
        Insert: {
          brand: string
          client_id: string
          created_at?: string
          id?: string
          model: string
          observations?: string
          plate?: string
          year?: string
        }
        Update: {
          brand?: string
          client_id?: string
          created_at?: string
          id?: string
          model?: string
          observations?: string
          plate?: string
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_assign_super_admin: { Args: never; Returns: undefined }
      get_user_id_by_email: { Args: { _email: string }; Returns: string }
      get_user_shop_ids: { Args: { _user_id: string }; Returns: string[] }
      has_shop_role: {
        Args: {
          _role: Database["public"]["Enums"]["shop_role"]
          _shop_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_shop_admin: {
        Args: { _shop_id: string; _user_id: string }
        Returns: boolean
      }
      is_shop_member: {
        Args: { _shop_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      shop_role: "admin" | "mechanic" | "financial"
      system_role: "super_admin"
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
      shop_role: ["admin", "mechanic", "financial"],
      system_role: ["super_admin"],
    },
  },
} as const
