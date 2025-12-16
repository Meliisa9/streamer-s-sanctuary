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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      casino_bonuses: {
        Row: {
          affiliate_url: string | null
          bonus_text: string
          bonus_type: string | null
          countries: string[] | null
          created_at: string
          features: string[] | null
          free_spins: number | null
          id: string
          is_exclusive: boolean | null
          is_featured: boolean | null
          is_published: boolean | null
          logo_url: string | null
          min_deposit: string | null
          name: string
          promo_code: string | null
          rating: number | null
          sort_order: number | null
          updated_at: string
          wagering: string | null
        }
        Insert: {
          affiliate_url?: string | null
          bonus_text: string
          bonus_type?: string | null
          countries?: string[] | null
          created_at?: string
          features?: string[] | null
          free_spins?: number | null
          id?: string
          is_exclusive?: boolean | null
          is_featured?: boolean | null
          is_published?: boolean | null
          logo_url?: string | null
          min_deposit?: string | null
          name: string
          promo_code?: string | null
          rating?: number | null
          sort_order?: number | null
          updated_at?: string
          wagering?: string | null
        }
        Update: {
          affiliate_url?: string | null
          bonus_text?: string
          bonus_type?: string | null
          countries?: string[] | null
          created_at?: string
          features?: string[] | null
          free_spins?: number | null
          id?: string
          is_exclusive?: boolean | null
          is_featured?: boolean | null
          is_published?: boolean | null
          logo_url?: string | null
          min_deposit?: string | null
          name?: string
          promo_code?: string | null
          rating?: number | null
          sort_order?: number | null
          updated_at?: string
          wagering?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string
          event_time: string | null
          event_type: string | null
          expected_viewers: string | null
          id: string
          is_featured: boolean | null
          is_recurring: boolean | null
          platform: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date: string
          event_time?: string | null
          event_type?: string | null
          expected_viewers?: string | null
          id?: string
          is_featured?: boolean | null
          is_recurring?: boolean | null
          platform?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string | null
          expected_viewers?: string | null
          id?: string
          is_featured?: boolean | null
          is_recurring?: boolean | null
          platform?: string | null
          title?: string
        }
        Relationships: []
      }
      giveaway_entries: {
        Row: {
          created_at: string
          giveaway_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          giveaway_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          giveaway_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_entries_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaways: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          image_url: string | null
          is_exclusive: boolean | null
          max_entries: number | null
          prize: string
          prize_type: string | null
          requirements: string[] | null
          start_date: string | null
          status: string | null
          title: string
          updated_at: string
          winner_ids: string[] | null
          winners_count: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          image_url?: string | null
          is_exclusive?: boolean | null
          max_entries?: number | null
          prize: string
          prize_type?: string | null
          requirements?: string[] | null
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string
          winner_ids?: string[] | null
          winners_count?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          image_url?: string | null
          is_exclusive?: boolean | null
          max_entries?: number | null
          prize?: string
          prize_type?: string | null
          requirements?: string[] | null
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          winner_ids?: string[] | null
          winners_count?: number | null
        }
        Relationships: []
      }
      gtw_guesses: {
        Row: {
          created_at: string
          guess_amount: number
          id: string
          points_earned: number | null
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          guess_amount: number
          id?: string
          points_earned?: number | null
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          guess_amount?: number
          id?: string
          points_earned?: number | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gtw_guesses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "gtw_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      gtw_sessions: {
        Row: {
          actual_total: number | null
          created_at: string
          created_by: string | null
          id: string
          lock_time: string | null
          pot_amount: string | null
          reveal_time: string | null
          status: string | null
          title: string
          winner_id: string | null
          winning_guess: number | null
        }
        Insert: {
          actual_total?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          lock_time?: string | null
          pot_amount?: string | null
          reveal_time?: string | null
          status?: string | null
          title: string
          winner_id?: string | null
          winning_guess?: number | null
        }
        Update: {
          actual_total?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          lock_time?: string | null
          pot_amount?: string | null
          reveal_time?: string | null
          status?: string | null
          title?: string
          winner_id?: string | null
          winning_guess?: number | null
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          author_id: string | null
          category: string | null
          content: string
          content_html: string | null
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_published: boolean | null
          likes_count: number | null
          slug: string
          title: string
          updated_at: string
          views: number | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content: string
          content_html?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          likes_count?: number | null
          slug: string
          title: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string
          content_html?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          likes_count?: number | null
          slug?: string
          title?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: []
      }
      news_comments: {
        Row: {
          article_id: string
          content: string
          created_at: string
          id: string
          is_approved: boolean | null
          user_id: string
        }
        Insert: {
          article_id: string
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          user_id: string
        }
        Update: {
          article_id?: string
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          discord_tag: string | null
          display_name: string | null
          id: string
          points: number | null
          twitch_username: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          discord_tag?: string | null
          display_name?: string | null
          id?: string
          points?: number | null
          twitch_username?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          discord_tag?: string | null
          display_name?: string | null
          id?: string
          points?: number | null
          twitch_username?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
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
          role?: Database["public"]["Enums"]["app_role"]
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
      video_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      video_likes: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration: string | null
          id: string
          is_external: boolean | null
          is_featured: boolean | null
          is_published: boolean | null
          likes_count: number | null
          multiplier: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_file_url: string | null
          video_url: string
          views: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          is_external?: boolean | null
          is_featured?: boolean | null
          is_published?: boolean | null
          likes_count?: number | null
          multiplier?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_file_url?: string | null
          video_url: string
          views?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          is_external?: boolean | null
          is_featured?: boolean | null
          is_published?: boolean | null
          likes_count?: number | null
          multiplier?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_file_url?: string | null
          video_url?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "video_categories"
            referencedColumns: ["id"]
          },
        ]
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
      is_admin_or_mod: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "user" | "moderator" | "admin"
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
      app_role: ["user", "moderator", "admin"],
    },
  },
} as const
