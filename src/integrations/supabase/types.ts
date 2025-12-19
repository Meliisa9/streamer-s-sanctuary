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
      admin_access_codes: {
        Row: {
          access_code: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_code: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_code?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      article_likes: {
        Row: {
          article_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_likes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      bonus_hunt_avgx_guesses: {
        Row: {
          bet_range: string | null
          created_at: string
          guess_x: number
          hunt_id: string
          id: string
          placement: number | null
          points_earned: number
          user_id: string
        }
        Insert: {
          bet_range?: string | null
          created_at?: string
          guess_x: number
          hunt_id: string
          id?: string
          placement?: number | null
          points_earned?: number
          user_id: string
        }
        Update: {
          bet_range?: string | null
          created_at?: string
          guess_x?: number
          hunt_id?: string
          id?: string
          placement?: number | null
          points_earned?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bonus_hunt_avgx_guesses_hunt_id_fkey"
            columns: ["hunt_id"]
            isOneToOne: false
            referencedRelation: "bonus_hunts"
            referencedColumns: ["id"]
          },
        ]
      }
      bonus_hunt_guesses: {
        Row: {
          created_at: string
          guess_amount: number
          hunt_id: string
          id: string
          points_earned: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          guess_amount: number
          hunt_id: string
          id?: string
          points_earned?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          guess_amount?: number
          hunt_id?: string
          id?: string
          points_earned?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bonus_hunt_guesses_hunt_id_fkey"
            columns: ["hunt_id"]
            isOneToOne: false
            referencedRelation: "bonus_hunts"
            referencedColumns: ["id"]
          },
        ]
      }
      bonus_hunt_slots: {
        Row: {
          bet_amount: number | null
          created_at: string
          hunt_id: string
          id: string
          is_played: boolean | null
          multiplier: number | null
          provider: string | null
          slot_name: string
          sort_order: number | null
          win_amount: number | null
        }
        Insert: {
          bet_amount?: number | null
          created_at?: string
          hunt_id: string
          id?: string
          is_played?: boolean | null
          multiplier?: number | null
          provider?: string | null
          slot_name: string
          sort_order?: number | null
          win_amount?: number | null
        }
        Update: {
          bet_amount?: number | null
          created_at?: string
          hunt_id?: string
          id?: string
          is_played?: boolean | null
          multiplier?: number | null
          provider?: string | null
          slot_name?: string
          sort_order?: number | null
          win_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bonus_hunt_slots_hunt_id_fkey"
            columns: ["hunt_id"]
            isOneToOne: false
            referencedRelation: "bonus_hunts"
            referencedColumns: ["id"]
          },
        ]
      }
      bonus_hunts: {
        Row: {
          average_bet: number | null
          avgx_bet_ranges: Json | null
          created_at: string
          created_by: string | null
          currency: string | null
          date: string
          ending_balance: number | null
          highest_multiplier: number | null
          highest_win: number | null
          id: string
          start_time: string | null
          starting_balance: number | null
          status: string
          target_balance: number | null
          title: string
          updated_at: string
          winner_points: number | null
          winner_user_id: string | null
        }
        Insert: {
          average_bet?: number | null
          avgx_bet_ranges?: Json | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          date?: string
          ending_balance?: number | null
          highest_multiplier?: number | null
          highest_win?: number | null
          id?: string
          start_time?: string | null
          starting_balance?: number | null
          status?: string
          target_balance?: number | null
          title: string
          updated_at?: string
          winner_points?: number | null
          winner_user_id?: string | null
        }
        Update: {
          average_bet?: number | null
          avgx_bet_ranges?: Json | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          date?: string
          ending_balance?: number | null
          highest_multiplier?: number | null
          highest_win?: number | null
          id?: string
          start_time?: string | null
          starting_balance?: number | null
          status?: string
          target_balance?: number | null
          title?: string
          updated_at?: string
          winner_points?: number | null
          winner_user_id?: string | null
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
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "news_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      content_flags: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          flagged_by: string
          id: string
          notes: string | null
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          flagged_by: string
          id?: string
          notes?: string | null
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          flagged_by?: string
          id?: string
          notes?: string | null
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      daily_sign_ins: {
        Row: {
          consecutive_days: number
          created_at: string
          id: string
          last_sign_in_date: string
          total_sign_ins: number
          updated_at: string
          user_id: string
        }
        Insert: {
          consecutive_days?: number
          created_at?: string
          id?: string
          last_sign_in_date?: string
          total_sign_ins?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          consecutive_days?: number
          created_at?: string
          id?: string
          last_sign_in_date?: string
          total_sign_ins?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      event_subscriptions: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_subscriptions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string | null
          event_date: string
          event_time: string | null
          event_type: string | null
          expected_viewers: string | null
          id: string
          is_featured: boolean | null
          is_recurring: boolean | null
          platform: string | null
          streamer_id: string | null
          timezone: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date: string
          event_time?: string | null
          event_type?: string | null
          expected_viewers?: string | null
          id?: string
          is_featured?: boolean | null
          is_recurring?: boolean | null
          platform?: string | null
          streamer_id?: string | null
          timezone?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string | null
          expected_viewers?: string | null
          id?: string
          is_featured?: boolean | null
          is_recurring?: boolean | null
          platform?: string | null
          streamer_id?: string | null
          timezone?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
        ]
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
          currency: string | null
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
          currency?: string | null
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
          currency?: string | null
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
      leaderboard_periods: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean | null
          period_type: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean | null
          period_type: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          period_type?: string
          start_date?: string
        }
        Relationships: []
      }
      leaderboard_snapshots: {
        Row: {
          created_at: string
          id: string
          period_id: string
          points: number
          rank: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          period_id: string
          points?: number
          rank?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          period_id?: string
          points?: number
          rank?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_snapshots_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_periods"
            referencedColumns: ["id"]
          },
        ]
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
          likes_count: number | null
          user_id: string
        }
        Insert: {
          article_id: string
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          likes_count?: number | null
          user_id: string
        }
        Update: {
          article_id?: string
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          likes_count?: number | null
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
      notification_preferences: {
        Row: {
          achievement_notifications: boolean
          created_at: string
          email_notifications: boolean
          event_notifications: boolean
          giveaway_notifications: boolean
          id: string
          push_enabled: boolean
          push_subscription: Json | null
          system_notifications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_notifications?: boolean
          created_at?: string
          email_notifications?: boolean
          event_notifications?: boolean
          giveaway_notifications?: boolean
          id?: string
          push_enabled?: boolean
          push_subscription?: Json | null
          system_notifications?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_notifications?: boolean
          created_at?: string
          email_notifications?: boolean
          event_notifications?: boolean
          giveaway_notifications?: boolean
          id?: string
          push_enabled?: boolean
          push_subscription?: Json | null
          system_notifications?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          is_approved: boolean | null
          is_community: boolean | null
          is_multiple_choice: boolean | null
          options: Json
          title: string
          total_votes: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          is_community?: boolean | null
          is_multiple_choice?: boolean | null
          options?: Json
          title: string
          total_votes?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          is_community?: boolean | null
          is_multiple_choice?: boolean | null
          options?: Json
          title?: string
          total_votes?: number | null
        }
        Relationships: []
      }
      profile_comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "profile_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_approved: boolean | null
          likes_count: number | null
          profile_user_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          likes_count?: number | null
          profile_user_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          likes_count?: number | null
          profile_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          cover_url: string | null
          created_at: string
          discord_tag: string | null
          display_name: string | null
          equipped_badge: string | null
          equipped_title: string | null
          favorite_casino: string | null
          favorite_slot: string | null
          followers_count: number | null
          following_count: number | null
          id: string
          is_private: boolean | null
          kick_username: string | null
          points: number | null
          twitch_username: string | null
          updated_at: string
          user_id: string
          username: string | null
          website: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          discord_tag?: string | null
          display_name?: string | null
          equipped_badge?: string | null
          equipped_title?: string | null
          favorite_casino?: string | null
          favorite_slot?: string | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          is_private?: boolean | null
          kick_username?: string | null
          points?: number | null
          twitch_username?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          website?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          discord_tag?: string | null
          display_name?: string | null
          equipped_badge?: string | null
          equipped_title?: string | null
          favorite_casino?: string | null
          favorite_slot?: string | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          is_private?: boolean | null
          kick_username?: string | null
          points?: number | null
          twitch_username?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          allowed: boolean
          created_at: string
          id: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          allowed?: boolean
          created_at?: string
          id?: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          allowed?: boolean
          created_at?: string
          id?: string
          permission?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          created_at: string
          created_by: string
          error_message: string | null
          id: string
          post_data: Json
          post_type: string
          published_at: string | null
          scheduled_for: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by: string
          error_message?: string | null
          id?: string
          post_data: Json
          post_type: string
          published_at?: string | null
          scheduled_for: string
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          error_message?: string | null
          id?: string
          post_data?: Json
          post_type?: string
          published_at?: string | null
          scheduled_for?: string
          status?: string
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
      streamers: {
        Row: {
          created_at: string
          description: string | null
          discord_url: string | null
          id: string
          image_url: string | null
          instagram_url: string | null
          is_active: boolean | null
          is_main_streamer: boolean | null
          kick_url: string | null
          name: string
          sort_order: number | null
          twitch_url: string | null
          twitter_url: string | null
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          discord_url?: string | null
          id?: string
          image_url?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          is_main_streamer?: boolean | null
          kick_url?: string | null
          name: string
          sort_order?: number | null
          twitch_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          discord_url?: string | null
          id?: string
          image_url?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          is_main_streamer?: boolean | null
          kick_url?: string | null
          name?: string
          sort_order?: number | null
          twitch_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_key: string
          id: string
          progress: number | null
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_key: string
          id?: string
          progress?: number | null
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_key?: string
          id?: string
          progress?: number | null
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activities: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          awarded_at: string
          awarded_by: string | null
          badge_color: string | null
          badge_icon: string | null
          badge_key: string
          badge_name: string
          id: string
          is_equipped: boolean | null
          is_title: boolean | null
          user_id: string
        }
        Insert: {
          awarded_at?: string
          awarded_by?: string | null
          badge_color?: string | null
          badge_icon?: string | null
          badge_key: string
          badge_name: string
          id?: string
          is_equipped?: boolean | null
          is_title?: boolean | null
          user_id: string
        }
        Update: {
          awarded_at?: string
          awarded_by?: string | null
          badge_color?: string | null
          badge_icon?: string | null
          badge_key?: string
          badge_name?: string
          id?: string
          is_equipped?: boolean | null
          is_title?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      user_bans: {
        Row: {
          banned_by: string
          created_at: string
          expires_at: string | null
          id: string
          ip_address: string | null
          is_ip_ban: boolean | null
          is_permanent: boolean | null
          reason: string | null
          unbanned_at: string | null
          unbanned_by: string | null
          user_id: string
        }
        Insert: {
          banned_by: string
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_ip_ban?: boolean | null
          is_permanent?: boolean | null
          reason?: string | null
          unbanned_at?: string | null
          unbanned_by?: string | null
          user_id: string
        }
        Update: {
          banned_by?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_ip_ban?: boolean | null
          is_permanent?: boolean | null
          reason?: string | null
          unbanned_at?: string | null
          unbanned_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_bookmarks: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_restrictions: {
        Row: {
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          reason: string | null
          restriction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string | null
          restriction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string | null
          restriction_type?: string
          user_id?: string
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
      user_warnings: {
        Row: {
          created_at: string | null
          id: string
          reason: string
          user_id: string
          warned_by: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason: string
          user_id: string
          warned_by: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string
          user_id?: string
          warned_by?: string
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
      determine_avgx_winners: {
        Args: { hunt_id_param: string }
        Returns: undefined
      }
      generate_avgx_bet_ranges: {
        Args: { hunt_id_param: string }
        Returns: Json
      }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_writer_role: { Args: { _user_id: string }; Returns: boolean }
      is_admin_or_mod: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "user" | "moderator" | "admin" | "writer"
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
      app_role: ["user", "moderator", "admin", "writer"],
    },
  },
} as const
