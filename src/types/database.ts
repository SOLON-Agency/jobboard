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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          archived_at: string | null
          created_at: string
          filters: Json
          frequency: Database["public"]["Enums"]["alert_frequency"]
          id: string
          is_active: boolean
          is_archived: boolean
          last_sent_at: string | null
          name: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          filters?: Json
          frequency?: Database["public"]["Enums"]["alert_frequency"]
          id?: string
          is_active?: boolean
          is_archived?: boolean
          last_sent_at?: string | null
          name: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          filters?: Json
          frequency?: Database["public"]["Enums"]["alert_frequency"]
          id?: string
          is_active?: boolean
          is_archived?: boolean
          last_sent_at?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          applied_at: string
          archived_at: string | null
          cv_url: string | null
          form_data: Json | null
          id: string
          is_archived: boolean
          job_id: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          user_id: string
          withdraw_reason: string | null
          withdrawn_at: string | null
        }
        Insert: {
          applied_at?: string
          archived_at?: string | null
          cv_url?: string | null
          form_data?: Json | null
          id?: string
          is_archived?: boolean
          job_id: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id: string
          withdraw_reason?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          applied_at?: string
          archived_at?: string | null
          cv_url?: string | null
          form_data?: Json | null
          id?: string
          is_archived?: boolean
          job_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string
          withdraw_reason?: string | null
          withdrawn_at?: string | null
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
          archived_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          engages: number
          founded_year: number | null
          id: string
          industry: string | null
          is_archived: boolean
          location: string | null
          logo_url: string | null
          name: string
          size: string | null
          slug: string
          updated_at: string
          visits: number
          website: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          engages?: number
          founded_year?: number | null
          id?: string
          industry?: string | null
          is_archived?: boolean
          location?: string | null
          logo_url?: string | null
          name: string
          size?: string | null
          slug: string
          updated_at?: string
          visits?: number
          website?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          engages?: number
          founded_year?: number | null
          id?: string
          industry?: string | null
          is_archived?: boolean
          location?: string | null
          logo_url?: string | null
          name?: string
          size?: string | null
          slug?: string
          updated_at?: string
          visits?: number
          website?: string | null
        }
        Relationships: []
      }
      company_favourites: {
        Row: {
          company_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_favourites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      form_response_values: {
        Row: {
          field_id: string
          id: string
          response_id: string
          value: string | null
        }
        Insert: {
          field_id: string
          id?: string
          response_id: string
          value?: string | null
        }
        Update: {
          field_id?: string
          id?: string
          response_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_response_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "form_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_response_values_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "form_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      form_responses: {
        Row: {
          created_at: string
          form_id: string
          id: string
          job_listing_id: string | null
          respondent_email: string | null
          respondent_name: string | null
        }
        Insert: {
          created_at?: string
          form_id: string
          id?: string
          job_listing_id?: string | null
          respondent_email?: string | null
          respondent_name?: string | null
        }
        Update: {
          created_at?: string
          form_id?: string
          id?: string
          job_listing_id?: string | null
          respondent_email?: string | null
          respondent_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_responses_job_listing_id_fkey"
            columns: ["job_listing_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_archived: boolean
          name: string
          status: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          name: string
          status?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          status?: string
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
      job_benefits: {
        Row: {
          created_at: string | null
          id: string
          job_id: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_benefits_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_listings: {
        Row: {
          application_form_id: string | null
          application_url: string | null
          applications_count: number
          archived_at: string | null
          benefits_count: number
          company_id: string
          created_at: string
          description: string | null
          experience_level: string[] | null
          expires_at: string | null
          id: string
          is_archived: boolean
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
          applications_count?: number
          archived_at?: string | null
          benefits_count?: number
          company_id: string
          created_at?: string
          description?: string | null
          experience_level?: string[] | null
          expires_at?: string | null
          id?: string
          is_archived?: boolean
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
          applications_count?: number
          archived_at?: string | null
          benefits_count?: number
          company_id?: string
          created_at?: string
          description?: string | null
          experience_level?: string[] | null
          expires_at?: string | null
          id?: string
          is_archived?: boolean
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
      profile_education: {
        Row: {
          created_at: string | null
          description: string | null
          end_year: number | null
          id: string
          institution: string
          is_current: boolean
          sort_order: number
          start_year: number | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_year?: number | null
          id?: string
          institution: string
          is_current?: boolean
          sort_order?: number
          start_year?: number | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_year?: number | null
          id?: string
          institution?: string
          is_current?: boolean
          sort_order?: number
          start_year?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_education_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_experience: {
        Row: {
          company: string
          created_at: string | null
          description: string | null
          end_year: number | null
          id: string
          is_current: boolean
          sort_order: number
          start_year: number | null
          title: string
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string | null
          description?: string | null
          end_year?: number | null
          id?: string
          is_current?: boolean
          sort_order?: number
          start_year?: number | null
          title: string
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string | null
          description?: string | null
          end_year?: number | null
          id?: string
          is_current?: boolean
          sort_order?: number
          start_year?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_experience_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_skills: {
        Row: {
          id: string
          skill_id: string
          sort_order: number
          user_id: string
        }
        Insert: {
          id?: string
          skill_id: string
          sort_order?: number
          user_id: string
        }
        Update: {
          id?: string
          skill_id?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          is_public: boolean
          location: string | null
          notifications_email: boolean
          notifications_sms: boolean
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
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
          is_public?: boolean
          location?: string | null
          notifications_email?: boolean
          notifications_sms?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
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
          is_public?: boolean
          location?: string | null
          notifications_email?: boolean
          notifications_sms?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          id: string
          is_approved: boolean
          name: string
        }
        Insert: {
          id?: string
          is_approved?: boolean
          name: string
        }
        Update: {
          id?: string
          is_approved?: boolean
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      admin_set_skill_approval: {
        Args: { p_is_approved: boolean; p_skill_id: string }
        Returns: undefined
      }
      admin_set_user_role: {
        Args: {
          p_role: Database["public"]["Enums"]["user_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      alerts_matching_job: {
        Args: { _job_id: string }
        Returns: {
          archived_at: string | null
          created_at: string
          filters: Json
          frequency: Database["public"]["Enums"]["alert_frequency"]
          id: string
          is_active: boolean
          is_archived: boolean
          last_sent_at: string | null
          name: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "alerts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      application_notification_recipient: {
        Args: { p_job_id: string }
        Returns: {
          poster_email: string
          poster_name: string
          poster_user_id: string
        }[]
      }
      can_submit_form_response: {
        Args: { p_form_id: string; p_job_listing_id: string }
        Returns: boolean
      }
      company_has_no_owner: { Args: { p_company_id: string }; Returns: boolean }
      increment_company_engages: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      increment_company_visits: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      is_company_member: {
        Args: {
          p_company_id: string
          p_min_role?: Database["public"]["Enums"]["company_role"]
        }
        Returns: boolean
      }
      job_poster_recipient: {
        Args: { p_job_id: string }
        Returns: {
          poster_email: string
          poster_name: string
          poster_user_id: string
        }[]
      }
    }
    Enums: {
      alert_frequency: "instant" | "daily" | "weekly"
      application_status:
        | "pending"
        | "reviewed"
        | "shortlisted"
        | "rejected"
        | "withdrawn"
      company_role: "owner" | "admin" | "member"
      entity_type: "user" | "company"
      job_status: "draft" | "published" | "archived"
      user_role: "user" | "employer" | "premium_employer" | "admin"
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
      alert_frequency: ["instant", "daily", "weekly"],
      application_status: [
        "pending",
        "reviewed",
        "shortlisted",
        "rejected",
        "withdrawn",
      ],
      company_role: ["owner", "admin", "member"],
      entity_type: ["user", "company"],
      job_status: ["draft", "published", "archived"],
      user_role: ["user", "employer", "premium_employer", "admin"],
    },
  },
} as const;
