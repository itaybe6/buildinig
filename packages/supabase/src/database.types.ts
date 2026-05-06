/**
 * Placeholder aligned with your Postgres schema.
 * Replace via: pnpm --filter @my-project/supabase gen-types (set SUPABASE_PROJECT_REF + CLI login).
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          primary_color: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          plan: string | null;
          commission_rate: string | null;
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          primary_color?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          plan?: string | null;
          commission_rate?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          primary_color?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          plan?: string | null;
          commission_rate?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      business_profiles: {
        Row: {
          id: string;
          tenant_id: string;
          legal_name: string | null;
          tax_id: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          legal_name?: string | null;
          tax_id?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          legal_name?: string | null;
          tax_id?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "business_profiles_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: true;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          auth_user_id: string | null;
          tenant_id: string | null;
          business_profile_id: string | null;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          push_token: string | null;
          role: Database["public"]["Enums"]["user_role"];
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          tenant_id?: string | null;
          business_profile_id?: string | null;
          full_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          push_token?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          tenant_id?: string | null;
          business_profile_id?: string | null;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          push_token?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      buildings: {
        Row: {
          id: string;
          tenant_id: string;
          business_profile_id: string | null;
          address: string;
          city: string;
          floors_count: number;
          image_url: string | null;
          manager_notes: string | null;
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          business_profile_id?: string | null;
          address: string;
          city: string;
          floors_count?: number;
          image_url?: string | null;
          manager_notes?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          business_profile_id?: string | null;
          address?: string;
          city?: string;
          floors_count?: number;
          image_url?: string | null;
          manager_notes?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      units: {
        Row: {
          id: string;
          tenant_id: string;
          business_profile_id: string | null;
          building_id: string;
          unit_number: string;
          type: string | null;
          size_sqm: number | null;
          monthly_fee: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          business_profile_id?: string | null;
          building_id: string;
          unit_number: string;
          type?: string | null;
          size_sqm?: number | null;
          monthly_fee?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          business_profile_id?: string | null;
          building_id?: string;
          unit_number?: string;
          type?: string | null;
          size_sqm?: number | null;
          monthly_fee?: string | null;
        };
        Relationships: [];
      };
      service_requests: {
        Row: {
          id: string;
          tenant_id: string;
          business_profile_id: string | null;
          building_id: string;
          unit_id: string | null;
          reported_by: string;
          assigned_to: string | null;
          title: string;
          description: string | null;
          category: Database["public"]["Enums"]["request_category"];
          status: Database["public"]["Enums"]["request_status"];
          priority: Database["public"]["Enums"]["request_priority"];
          image_urls: string[] | null;
          internal_notes: string | null;
          resolved_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          business_profile_id?: string | null;
          building_id: string;
          unit_id?: string | null;
          reported_by: string;
          assigned_to?: string | null;
          title: string;
          description?: string | null;
          category?: Database["public"]["Enums"]["request_category"];
          status?: Database["public"]["Enums"]["request_status"];
          priority?: Database["public"]["Enums"]["request_priority"];
          image_urls?: string[] | null;
          internal_notes?: string | null;
          resolved_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          business_profile_id?: string | null;
          building_id?: string;
          unit_id?: string | null;
          reported_by?: string;
          assigned_to?: string | null;
          title?: string;
          description?: string | null;
          category?: Database["public"]["Enums"]["request_category"];
          status?: Database["public"]["Enums"]["request_status"];
          priority?: Database["public"]["Enums"]["request_priority"];
          image_urls?: string[] | null;
          internal_notes?: string | null;
          resolved_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      service_request_comments: {
        Row: {
          id: string;
          tenant_id: string;
          business_profile_id: string | null;
          request_id: string;
          author_id: string;
          body: string;
          image_urls: string[] | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          business_profile_id?: string | null;
          request_id: string;
          author_id: string;
          body: string;
          image_urls?: string[] | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          business_profile_id?: string | null;
          request_id?: string;
          author_id?: string;
          body?: string;
          image_urls?: string[] | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          tenant_id: string;
          business_profile_id: string | null;
          building_id: string;
          created_by: string;
          title: string;
          body: string;
          image_urls: string[] | null;
          audience: Database["public"]["Enums"]["announcement_audience"] | null;
          is_pinned: boolean | null;
          expires_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          business_profile_id?: string | null;
          building_id: string;
          created_by: string;
          title: string;
          body: string;
          image_urls?: string[] | null;
          audience?: Database["public"]["Enums"]["announcement_audience"] | null;
          is_pinned?: boolean | null;
          expires_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          business_profile_id?: string | null;
          building_id?: string;
          created_by?: string;
          title?: string;
          body?: string;
          image_urls?: string[] | null;
          audience?: Database["public"]["Enums"]["announcement_audience"] | null;
          is_pinned?: boolean | null;
          expires_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          tenant_id: string;
          business_profile_id: string | null;
          building_id: string;
          unit_id: string;
          resident_id: string;
          amount: string;
          currency: string | null;
          type: Database["public"]["Enums"]["payment_type"];
          status: Database["public"]["Enums"]["payment_status"];
          method: Database["public"]["Enums"]["payment_method"] | null;
          external_tx_id: string | null;
          description: string | null;
          due_date: string;
          paid_at: string | null;
          receipt_url: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          business_profile_id?: string | null;
          building_id: string;
          unit_id: string;
          resident_id: string;
          amount: string;
          currency?: string | null;
          type?: Database["public"]["Enums"]["payment_type"];
          status?: Database["public"]["Enums"]["payment_status"];
          method?: Database["public"]["Enums"]["payment_method"] | null;
          external_tx_id?: string | null;
          description?: string | null;
          due_date: string;
          paid_at?: string | null;
          receipt_url?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          business_profile_id?: string | null;
          building_id?: string;
          unit_id?: string;
          resident_id?: string;
          amount?: string;
          currency?: string | null;
          type?: Database["public"]["Enums"]["payment_type"];
          status?: Database["public"]["Enums"]["payment_status"];
          method?: Database["public"]["Enums"]["payment_method"] | null;
          external_tx_id?: string | null;
          description?: string | null;
          due_date?: string;
          paid_at?: string | null;
          receipt_url?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          tenant_id: string;
          business_profile_id: string | null;
          profile_id: string;
          type: string;
          title: string;
          body: string | null;
          is_read: boolean | null;
          ref_id: string | null;
          ref_table: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          business_profile_id?: string | null;
          profile_id: string;
          type: string;
          title: string;
          body?: string | null;
          is_read?: boolean | null;
          ref_id?: string | null;
          ref_table?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          business_profile_id?: string | null;
          profile_id?: string;
          type?: string;
          title?: string;
          body?: string | null;
          is_read?: boolean | null;
          ref_id?: string | null;
          ref_table?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      service_types: {
        Row: {
          id: string;
          tenant_id: string;
          business_profile_id: string | null;
          name: string;
          description: string | null;
          category: Database["public"]["Enums"]["request_category"];
          price_min: string | null;
          price_max: string | null;
          price_unit: string | null;
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          business_profile_id?: string | null;
          name: string;
          description?: string | null;
          category?: Database["public"]["Enums"]["request_category"];
          price_min?: string | null;
          price_max?: string | null;
          price_unit?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          business_profile_id?: string | null;
          name?: string;
          description?: string | null;
          category?: Database["public"]["Enums"]["request_category"];
          price_min?: string | null;
          price_max?: string | null;
          price_unit?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      quote_requests: {
        Row: {
          id: string;
          tenant_id: string;
          business_profile_id: string | null;
          building_id: string;
          unit_id: string;
          requested_by: string;
          service_type_id: string | null;
          title: string;
          description: string | null;
          image_urls: string[] | null;
          preferred_date: string | null;
          status: Database["public"]["Enums"]["quote_status"];
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          business_profile_id?: string | null;
          building_id: string;
          unit_id: string;
          requested_by: string;
          service_type_id?: string | null;
          title: string;
          description?: string | null;
          image_urls?: string[] | null;
          preferred_date?: string | null;
          status?: Database["public"]["Enums"]["quote_status"];
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          business_profile_id?: string | null;
          building_id?: string;
          unit_id?: string;
          requested_by?: string;
          service_type_id?: string | null;
          title?: string;
          description?: string | null;
          image_urls?: string[] | null;
          preferred_date?: string | null;
          status?: Database["public"]["Enums"]["quote_status"];
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      quotes: {
        Row: {
          id: string;
          tenant_id: string;
          business_profile_id: string | null;
          request_id: string;
          created_by: string;
          amount: string;
          description: string;
          valid_until: string | null;
          notes: string | null;
          document_url: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          business_profile_id?: string | null;
          request_id: string;
          created_by: string;
          amount: string;
          description: string;
          valid_until?: string | null;
          notes?: string | null;
          document_url?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          business_profile_id?: string | null;
          request_id?: string;
          created_by?: string;
          amount?: string;
          description?: string;
          valid_until?: string | null;
          notes?: string | null;
          document_url?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      quote_signatures: {
        Row: {
          id: string;
          tenant_id: string;
          business_profile_id: string | null;
          quote_id: string;
          signed_by: string;
          signature_url: string | null;
          ip_address: string | null;
          signed_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          business_profile_id?: string | null;
          quote_id: string;
          signed_by: string;
          signature_url?: string | null;
          ip_address?: string | null;
          signed_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          business_profile_id?: string | null;
          quote_id?: string;
          signed_by?: string;
          signature_url?: string | null;
          ip_address?: string | null;
          signed_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      my_tenant_id: { Args: Record<string, never>; Returns: string | null };
      my_role: {
        Args: Record<string, never>;
        Returns: Database["public"]["Enums"]["user_role"] | null;
      };
      my_profile_id: { Args: Record<string, never>; Returns: string | null };
    };
    Enums: {
      announcement_audience: "all" | "residents" | "employees";
      payment_method: "credit_card" | "bit" | "bank_transfer" | "cash";
      payment_status: "pending" | "paid" | "overdue" | "cancelled";
      payment_type: "monthly_fee" | "one_time" | "fine";
      quote_status: "pending" | "sent" | "approved" | "rejected" | "completed";
      request_category:
        | "electrical"
        | "plumbing"
        | "cleaning"
        | "elevator"
        | "garden"
        | "security"
        | "other";
      request_priority: "low" | "medium" | "high" | "urgent";
      request_status: "open" | "assigned" | "in_progress" | "resolved" | "closed";
      resident_status: "active" | "former";
      user_role: "super_admin" | "manager" | "employee" | "resident";
    };
    CompositeTypes: Record<string, never>;
  };
};
