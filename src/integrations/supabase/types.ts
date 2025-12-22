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
      admin_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      amazon_settings: {
        Row: {
          client_id: string
          client_secret: string
          created_at: string
          id: string
          is_active: boolean
          last_sync_at: string | null
          marketplace: string
          refresh_token: string
          update_frequency_hours: number
          updated_at: string
        }
        Insert: {
          client_id?: string
          client_secret?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          marketplace?: string
          refresh_token?: string
          update_frequency_hours?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          client_secret?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          marketplace?: string
          refresh_token?: string
          update_frequency_hours?: number
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      auto_orders: {
        Row: {
          amazon_asin: string | null
          amazon_order_id: string | null
          amazon_url: string | null
          buyer_address: Json | null
          buyer_name: string | null
          created_at: string | null
          details: Json | null
          ebay_order_id: string | null
          ebay_sku: string | null
          error_message: string | null
          id: string
          item_price: number | null
          listing_id: string | null
          profit: number | null
          risk_score: number | null
          shipping_cost: number | null
          status: string | null
          total_cost: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amazon_asin?: string | null
          amazon_order_id?: string | null
          amazon_url?: string | null
          buyer_address?: Json | null
          buyer_name?: string | null
          created_at?: string | null
          details?: Json | null
          ebay_order_id?: string | null
          ebay_sku?: string | null
          error_message?: string | null
          id?: string
          item_price?: number | null
          listing_id?: string | null
          profit?: number | null
          risk_score?: number | null
          shipping_cost?: number | null
          status?: string | null
          total_cost?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          amazon_asin?: string | null
          amazon_order_id?: string | null
          amazon_url?: string | null
          buyer_address?: Json | null
          buyer_name?: string | null
          created_at?: string | null
          details?: Json | null
          ebay_order_id?: string | null
          ebay_sku?: string | null
          error_message?: string | null
          id?: string
          item_price?: number | null
          listing_id?: string | null
          profit?: number | null
          risk_score?: number | null
          shipping_cost?: number | null
          status?: string | null
          total_cost?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      calculator_settings: {
        Row: {
          created_at: string
          desired_profit_percent: number
          ebay_fee_percent: number
          id: string
          promotional_fee_percent: number
          tax_percent: number
          tracking_fee: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          desired_profit_percent?: number
          ebay_fee_percent?: number
          id?: string
          promotional_fee_percent?: number
          tax_percent?: number
          tracking_fee?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          desired_profit_percent?: number
          ebay_fee_percent?: number
          id?: string
          promotional_fee_percent?: number
          tax_percent?: number
          tracking_fee?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coupon_usages: {
        Row: {
          coupon_id: string
          discount_applied: number
          id: string
          stripe_session_id: string | null
          used_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          discount_applied: number
          id?: string
          stripe_session_id?: string | null
          used_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          discount_applied?: number
          id?: string
          stripe_session_id?: string | null
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usages_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applicable_plans: string[] | null
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          is_one_time_per_user: boolean
          max_discount_amount: number | null
          min_order_amount: number | null
          updated_at: string
          usage_limit: number | null
          used_count: number
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          applicable_plans?: string[] | null
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value: number
          id?: string
          is_active?: boolean
          is_one_time_per_user?: boolean
          max_discount_amount?: number | null
          min_order_amount?: number | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          applicable_plans?: string[] | null
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          is_one_time_per_user?: boolean
          max_discount_amount?: number | null
          min_order_amount?: number | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      extension_sessions: {
        Row: {
          browser: string | null
          created_at: string | null
          device_name: string | null
          extension_id: string
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_seen: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          device_name?: string | null
          extension_id: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_seen?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          device_name?: string | null
          extension_id?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_seen?: string | null
          user_id?: string
        }
        Relationships: []
      }
      inventory_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          listing_id: string | null
          message: string | null
          new_value: string | null
          old_value: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          listing_id?: string | null
          message?: string | null
          new_value?: string | null
          old_value?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          listing_id?: string | null
          message?: string | null
          new_value?: string | null
          old_value?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_alerts_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_sync_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          listing_id: string | null
          new_price: number | null
          new_stock: number | null
          old_price: number | null
          old_stock: number | null
          status: string
          sync_type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          listing_id?: string | null
          new_price?: number | null
          new_stock?: number | null
          old_price?: number | null
          old_stock?: number | null
          status?: string
          sync_type: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          listing_id?: string | null
          new_price?: number | null
          new_stock?: number | null
          old_price?: number | null
          old_stock?: number | null
          status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_sync_logs_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          amazon_asin: string | null
          amazon_price: number | null
          amazon_stock_quantity: number | null
          amazon_stock_status: string | null
          amazon_url: string | null
          auto_order_enabled: boolean | null
          created_at: string | null
          ebay_item_id: string | null
          ebay_price: number | null
          id: string
          inventory_last_updated: string | null
          inventory_status: string | null
          last_checked: string | null
          price_last_updated: string | null
          pricing_rule: Json | null
          sku: string | null
          status: string | null
          sync_error: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amazon_asin?: string | null
          amazon_price?: number | null
          amazon_stock_quantity?: number | null
          amazon_stock_status?: string | null
          amazon_url?: string | null
          auto_order_enabled?: boolean | null
          created_at?: string | null
          ebay_item_id?: string | null
          ebay_price?: number | null
          id?: string
          inventory_last_updated?: string | null
          inventory_status?: string | null
          last_checked?: string | null
          price_last_updated?: string | null
          pricing_rule?: Json | null
          sku?: string | null
          status?: string | null
          sync_error?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amazon_asin?: string | null
          amazon_price?: number | null
          amazon_stock_quantity?: number | null
          amazon_stock_status?: string | null
          amazon_url?: string | null
          auto_order_enabled?: boolean | null
          created_at?: string | null
          ebay_item_id?: string | null
          ebay_price?: number | null
          id?: string
          inventory_last_updated?: string | null
          inventory_status?: string | null
          last_checked?: string | null
          price_last_updated?: string | null
          pricing_rule?: Json | null
          sku?: string | null
          status?: string | null
          sync_error?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notices: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          priority: number
          starts_at: string | null
          target_audience: string
          target_plan_id: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          starts_at?: string | null
          target_audience?: string
          target_plan_id?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          starts_at?: string | null
          target_audience?: string
          target_plan_id?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notices_target_plan_id_fkey"
            columns: ["target_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          created_at: string
          email_sent_to: string | null
          error_message: string | null
          id: string
          listing_id: string | null
          message: string
          notification_type: string
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_sent_to?: string | null
          error_message?: string | null
          id?: string
          listing_id?: string | null
          message: string
          notification_type: string
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_sent_to?: string | null
          error_message?: string | null
          id?: string
          listing_id?: string | null
          message?: string
          notification_type?: string
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string
          email_notifications_enabled: boolean
          id: string
          notification_email: string | null
          notify_low_stock: boolean
          notify_out_of_stock: boolean
          notify_price_decrease: boolean
          notify_price_increase: boolean
          price_change_threshold: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications_enabled?: boolean
          id?: string
          notification_email?: string | null
          notify_low_stock?: boolean
          notify_out_of_stock?: boolean
          notify_price_decrease?: boolean
          notify_price_increase?: boolean
          price_change_threshold?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications_enabled?: boolean
          id?: string
          notification_email?: string | null
          notify_low_stock?: boolean
          notify_out_of_stock?: boolean
          notify_price_decrease?: boolean
          notify_price_increase?: boolean
          price_change_threshold?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string | null
          credits_per_month: number | null
          display_name: string
          features: Json | null
          id: string
          is_active: boolean | null
          max_auto_orders: number | null
          max_listings: number | null
          name: string
          price_monthly: number | null
          price_yearly: number | null
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits_per_month?: number | null
          display_name: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_auto_orders?: number | null
          max_listings?: number | null
          name: string
          price_monthly?: number | null
          price_yearly?: number | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits_per_month?: number | null
          display_name?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_auto_orders?: number | null
          max_listings?: number | null
          name?: string
          price_monthly?: number | null
          price_yearly?: number | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          credits: number | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          plan_id: string | null
          settings: Json | null
          stripe_customer_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          credits?: number | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          last_login?: string | null
          plan_id?: string | null
          settings?: Json | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          credits?: number | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          plan_id?: string | null
          settings?: Json | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          prompt_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          prompt_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          prompt_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          action: string
          created_at: string | null
          credits_used: number | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          credits_used?: number | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          credits_used?: number | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_plans: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "user" | "admin" | "super_admin"
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
      app_role: ["user", "admin", "super_admin"],
    },
  },
} as const
