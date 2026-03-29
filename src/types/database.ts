export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          filters: Json
          frequency: Database["public"]["Enums"]["alert_frequency"]
          id: string
          is_active: boolean
          last_sent_at: string | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          frequency?: Database["public"]["Enums"]["alert_frequency"]
          id?: string
          is_active?: boolean
          last_sent_at?: string | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          frequency?: Database["public"]["Enums"]["alert_frequency"]
          id?: string
          is_active?: boolean
          last_sent_at?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          applied_at: string
          cv_url: string | null
          form_data: Json | null
          id: string
          job_id: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string
          cv_url?: string | null
          form_data?: Json | null
          id?: string
          job_id: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string
          cv_url?: string | null
          form_data?: Json | null
          id?: string
          job_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          founded_year: number | null
          id: string
          industry: string | null
          location: string | null
          logo_url: string | null
          name: string
          size: string | null
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          location?: string | null
          logo_url?: string | null
          name: string
          size?: string | null
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          location?: string | null
          logo_url?: string | null
          name?: string
          size?: string | null
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      company_users: {
        Row: {
          accepted_at: string | null
          company_id: string
          invited_at: string
          role: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          invited_at?: string
          role?: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          invited_at?: string
          role?: Database["public"]["Enums"]["company_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_info: {
        Row: {
          email: string | null
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          linkedin: string | null
          phone: string | null
          website: string | null
        }
        Insert: {
          email?: string | null
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          linkedin?: string | null
          phone?: string | null
          website?: string | null
        }
        Update: {
          email?: string | null
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          linkedin?: string | null
          phone?: string | null
          website?: string | null
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id?: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          job_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      form_fields: {
        Row: {
          field_type: string
          form_id: string
          id: string
          is_required: boolean
          label: string
          options: Json | null
          placeholder: string | null
          sort_order: number
        }
        Insert: {
          field_type: string
          form_id: string
          id?: string
          is_required?: boolean
          label: string
          options?: Json | null
          placeholder?: string | null
          sort_order: number
        }
        Update: {
          field_type?: string
          form_id?: string
          id?: string
          is_required?: boolean
          label?: string
          options?: Json | null
          placeholder?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "form_fields_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "forms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      job_listings: {
        Row: {
          application_form_id: string | null
          application_url: string | null
          company_id: string
          created_at: string
          description: string | null
          experience_level: string | null
          expires_at: string | null
          id: string
          is_external: boolean
          is_remote: boolean
          job_type: string | null
          location: string | null
          published_at: string | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          search_vector: unknown
          slug: string
          source_hash: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
        }
        Insert: {
          application_form_id?: string | null
          application_url?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          experience_level?: string | null
          expires_at?: string | null
          id?: string
          is_external?: boolean
          is_remote?: boolean
          job_type?: string | null
          location?: string | null
          published_at?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          search_vector?: unknown
          slug: string
          source_hash?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
        }
        Update: {
          application_form_id?: string | null
          application_url?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          experience_level?: string | null
          expires_at?: string | null
          id?: string
          is_external?: boolean
          is_remote?: boolean
          job_type?: string | null
          location?: string | null
          published_at?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          search_vector?: unknown
          slug?: string
          source_hash?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_listings_application_form_id_fkey"
            columns: ["application_form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_listings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          cv_url: string | null
          experience_level: string | null
          full_name: string | null
          headline: string | null
          id: string
          location: string | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          cv_url?: string | null
          experience_level?: string | null
          full_name?: string | null
          headline?: string | null
          id: string
          location?: string | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          cv_url?: string | null
          experience_level?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string
          location?: string | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_company_member: {
        Args: {
          p_company_id: string
          p_min_role?: Database["public"]["Enums"]["company_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      alert_frequency: "daily" | "weekly"
      application_status: "pending" | "reviewed" | "shortlisted" | "rejected"
      company_role: "owner" | "admin" | "member"
      entity_type: "user" | "company"
      job_status: "draft" | "published" | "archived"
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
