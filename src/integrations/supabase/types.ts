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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ab_test_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          test_id: string
          user_id: string | null
          variant: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          test_id: string
          user_id?: string | null
          variant: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          test_id?: string
          user_id?: string | null
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_events_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "ab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_tests: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          start_date: string | null
          target_page: string
          variant_a: Json
          variant_b: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          start_date?: string | null
          target_page: string
          variant_a: Json
          variant_b: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string | null
          target_page?: string
          variant_a?: Json
          variant_b?: Json
        }
        Relationships: []
      }
      admin_email_change_requests: {
        Row: {
          cancelled_at: string | null
          code_hash: string
          confirmed_at: string | null
          confirmed_ip: unknown
          created_at: string
          expires_at: string
          id: string
          new_email: string
          old_email: string
          requested_by: string | null
          requested_user_agent: string | null
          target_user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          code_hash: string
          confirmed_at?: string | null
          confirmed_ip?: unknown
          created_at?: string
          expires_at: string
          id?: string
          new_email: string
          old_email: string
          requested_by?: string | null
          requested_user_agent?: string | null
          target_user_id: string
        }
        Update: {
          cancelled_at?: string | null
          code_hash?: string
          confirmed_at?: string | null
          confirmed_ip?: unknown
          created_at?: string
          expires_at?: string
          id?: string
          new_email?: string
          old_email?: string
          requested_by?: string | null
          requested_user_agent?: string | null
          target_user_id?: string
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_read: boolean | null
          link: string | null
          title: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_read?: boolean | null
          link?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_read?: boolean | null
          link?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ads: {
        Row: {
          click_count: number | null
          content_html: string | null
          created_at: string | null
          end_date: string | null
          id: string
          image_url: string | null
          impression_count: number | null
          is_active: boolean | null
          link_url: string | null
          name: string
          position: string
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          click_count?: number | null
          content_html?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          impression_count?: number | null
          is_active?: boolean | null
          link_url?: string | null
          name: string
          position: string
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          click_count?: number | null
          content_html?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          impression_count?: number | null
          is_active?: boolean | null
          link_url?: string | null
          name?: string
          position?: string
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          consultant_id: string
          created_at: string | null
          duration_minutes: number | null
          id: string
          meeting_link: string | null
          notes: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          appointment_date: string
          consultant_id: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          appointment_date?: string
          consultant_id?: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_title: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_title?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_title?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          auto: boolean
          category: string
          color: string
          condition: string | null
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          rarity: string
          updated_at: string
        }
        Insert: {
          auto?: boolean
          category?: string
          color?: string
          condition?: string | null
          created_at?: string
          description?: string | null
          icon?: string
          id: string
          is_active?: boolean
          name: string
          rarity?: string
          updated_at?: string
        }
        Update: {
          auto?: boolean
          category?: string
          color?: string
          condition?: string | null
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          rarity?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          order_index: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          order_index?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          order_index?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_approved: boolean | null
          like_count: number | null
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          like_count?: number | null
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          like_count?: number | null
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string
          category_id: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          like_count: number | null
          meta_description: string | null
          meta_title: string | null
          scheduled_at: string | null
          slug: string
          tags: Json | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author_id: string
          category_id?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          like_count?: number | null
          meta_description?: string | null
          meta_title?: string | null
          scheduled_at?: string | null
          slug: string
          tags?: Json | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author_id?: string
          category_id?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          like_count?: number | null
          meta_description?: string | null
          meta_title?: string | null
          scheduled_at?: string | null
          slug?: string
          tags?: Json | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          is_verified: boolean | null
          name: string | null
          subscribed_at: string | null
          unsubscribed_at: string | null
          updated_at: string
          verification_token: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_verified?: boolean | null
          name?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          verification_token?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_verified?: boolean | null
          name?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          verification_token?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_featured: boolean
          name: string
          order_index: number | null
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_featured?: boolean
          name: string
          order_index?: number | null
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_featured?: boolean
          name?: string
          order_index?: number | null
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string | null
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          dream_id: string
          id: string
          is_approved: boolean | null
          like_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          dream_id: string
          id?: string
          is_approved?: boolean | null
          like_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          dream_id?: string
          id?: string
          is_approved?: boolean | null
          like_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_dream_id_fkey"
            columns: ["dream_id"]
            isOneToOne: false
            referencedRelation: "dreams"
            referencedColumns: ["id"]
          },
        ]
      }
      consultants: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          hourly_rate: number | null
          id: string
          is_available: boolean | null
          rating: number | null
          specialties: string[] | null
          title: string
          total_sessions: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          rating?: number | null
          specialties?: string[] | null
          title: string
          total_sessions?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          rating?: number | null
          specialties?: string[] | null
          title?: string
          total_sessions?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      content_calendar: {
        Row: {
          assigned_to: string | null
          content_type: string
          created_at: string | null
          description: string | null
          id: string
          scheduled_date: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          content_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          scheduled_date: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          content_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          scheduled_date?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cron_jobs_log: {
        Row: {
          error: string | null
          id: string
          jobname: string
          ran_at: string
          response: Json | null
          status: string | null
        }
        Insert: {
          error?: string | null
          id?: string
          jobname: string
          ran_at?: string
          response?: Json | null
          status?: string | null
        }
        Update: {
          error?: string | null
          id?: string
          jobname?: string
          ran_at?: string
          response?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      cultural_interpretations: {
        Row: {
          created_at: string | null
          culture_code: string
          culture_name: string
          id: string
          interpretation: string
          region: string | null
          source: string | null
          symbol_name: string
        }
        Insert: {
          created_at?: string | null
          culture_code: string
          culture_name: string
          id?: string
          interpretation: string
          region?: string | null
          source?: string | null
          symbol_name: string
        }
        Update: {
          created_at?: string | null
          culture_code?: string
          culture_name?: string
          id?: string
          interpretation?: string
          region?: string | null
          source?: string | null
          symbol_name?: string
        }
        Relationships: []
      }
      daily_polls: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          options: Json
          poll_date: string
          question: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json
          poll_date: string
          question: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json
          poll_date?: string
          question?: string
        }
        Relationships: []
      }
      dream_journal: {
        Row: {
          content: string
          created_at: string
          dream_date: string | null
          id: string
          is_private: boolean | null
          mood: string | null
          tags: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          dream_date?: string | null
          id?: string
          is_private?: boolean | null
          mood?: string | null
          tags?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          dream_date?: string | null
          id?: string
          is_private?: boolean | null
          mood?: string | null
          tags?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dream_likes: {
        Row: {
          created_at: string
          dream_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dream_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dream_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dream_likes_dream_id_fkey"
            columns: ["dream_id"]
            isOneToOne: false
            referencedRelation: "dreams"
            referencedColumns: ["id"]
          },
        ]
      }
      dream_locations: {
        Row: {
          city: string | null
          country_code: string | null
          country_name: string | null
          created_at: string | null
          dream_id: string
          id: string
          region: string | null
        }
        Insert: {
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string | null
          dream_id: string
          id?: string
          region?: string | null
        }
        Update: {
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string | null
          dream_id?: string
          id?: string
          region?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dream_locations_dream_id_fkey"
            columns: ["dream_id"]
            isOneToOne: false
            referencedRelation: "dreams"
            referencedColumns: ["id"]
          },
        ]
      }
      dream_symbols: {
        Row: {
          created_at: string | null
          cultural_meanings: Json | null
          description: string | null
          id: string
          image_url: string | null
          islamic_meaning: string | null
          name: string
          psychological_meaning: string | null
          related_symbols: string[] | null
          slug: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          cultural_meanings?: Json | null
          description?: string | null
          id?: string
          image_url?: string | null
          islamic_meaning?: string | null
          name: string
          psychological_meaning?: string | null
          related_symbols?: string[] | null
          slug: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          cultural_meanings?: Json | null
          description?: string | null
          id?: string
          image_url?: string | null
          islamic_meaning?: string | null
          name?: string
          psychological_meaning?: string | null
          related_symbols?: string[] | null
          slug?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      dreams: {
        Row: {
          category_id: string | null
          content: string
          created_at: string
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          islamic_interpretation: string | null
          keywords: Json | null
          like_count: number | null
          meta_description: string | null
          meta_title: string | null
          psychological_interpretation: string | null
          slug: string
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          category_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          islamic_interpretation?: string | null
          keywords?: Json | null
          like_count?: number | null
          meta_description?: string | null
          meta_title?: string | null
          psychological_interpretation?: string | null
          slug: string
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          category_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          islamic_interpretation?: string | null
          keywords?: Json | null
          like_count?: number | null
          meta_description?: string | null
          meta_title?: string | null
          psychological_interpretation?: string | null
          slug?: string
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dreams_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      drip_campaigns: {
        Row: {
          active: boolean
          click_rate: number
          created_at: string
          created_by: string | null
          description: string | null
          enrolled_count: number
          id: string
          name: string
          open_rate: number
          segment: string
          trigger: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          click_rate?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          enrolled_count?: number
          id?: string
          name: string
          open_rate?: number
          segment?: string
          trigger?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          click_rate?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          enrolled_count?: number
          id?: string
          name?: string
          open_rate?: number
          segment?: string
          trigger?: string
          updated_at?: string
        }
        Relationships: []
      }
      drip_enrollments: {
        Row: {
          campaign_id: string
          enrolled_at: string
          id: string
          last_step: number
          status: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          enrolled_at?: string
          id?: string
          last_step?: number
          status?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          enrolled_at?: string
          id?: string
          last_step?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drip_enrollments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "drip_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      drip_step_events: {
        Row: {
          enrollment_id: string
          event: string
          id: string
          step_id: string
          ts: string
        }
        Insert: {
          enrollment_id: string
          event: string
          id?: string
          step_id: string
          ts?: string
        }
        Update: {
          enrollment_id?: string
          event?: string
          id?: string
          step_id?: string
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "drip_step_events_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "drip_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drip_step_events_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "drip_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      drip_steps: {
        Row: {
          body: string | null
          campaign_id: string
          day_offset: number
          id: string
          step_index: number
          subject: string
        }
        Insert: {
          body?: string | null
          campaign_id: string
          day_offset?: number
          id?: string
          step_index: number
          subject: string
        }
        Update: {
          body?: string | null
          campaign_id?: string
          day_offset?: number
          id?: string
          step_index?: number
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "drip_steps_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "drip_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          dream_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dream_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dream_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_dream_id_fkey"
            columns: ["dream_id"]
            isOneToOne: false
            referencedRelation: "dreams"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          comment_notification: boolean | null
          created_at: string | null
          daily_reminder: boolean | null
          email_notifications: boolean | null
          id: string
          new_dream_notification: boolean | null
          push_notifications: boolean | null
          reminder_time: string | null
          updated_at: string | null
          user_id: string
          weekly_summary: boolean | null
        }
        Insert: {
          comment_notification?: boolean | null
          created_at?: string | null
          daily_reminder?: boolean | null
          email_notifications?: boolean | null
          id?: string
          new_dream_notification?: boolean | null
          push_notifications?: boolean | null
          reminder_time?: string | null
          updated_at?: string | null
          user_id: string
          weekly_summary?: boolean | null
        }
        Update: {
          comment_notification?: boolean | null
          created_at?: string | null
          daily_reminder?: boolean | null
          email_notifications?: boolean | null
          id?: string
          new_dream_notification?: boolean | null
          push_notifications?: boolean | null
          reminder_time?: string | null
          updated_at?: string | null
          user_id?: string
          weekly_summary?: boolean | null
        }
        Relationships: []
      }
      ottoman_interpretations: {
        Row: {
          created_at: string | null
          era: string | null
          id: string
          interpretation: string
          keywords: string[] | null
          source_author: string | null
          source_book: string | null
          symbol_name: string
        }
        Insert: {
          created_at?: string | null
          era?: string | null
          id?: string
          interpretation: string
          keywords?: string[] | null
          source_author?: string | null
          source_book?: string | null
          symbol_name: string
        }
        Update: {
          created_at?: string | null
          era?: string | null
          id?: string
          interpretation?: string
          keywords?: string[] | null
          source_author?: string | null
          source_book?: string | null
          symbol_name?: string
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
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
            referencedRelation: "daily_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          keys: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          keys: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          keys?: Json
          user_id?: string
        }
        Relationships: []
      }
      search_logs: {
        Row: {
          created_at: string
          id: string
          query: string
          results_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          query: string
          results_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          query?: string
          results_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      sleep_quality: {
        Row: {
          created_at: string | null
          hours_slept: number | null
          id: string
          notes: string | null
          quality: number | null
          sleep_date: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          hours_slept?: number | null
          id?: string
          notes?: string | null
          quality?: number | null
          sleep_date: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          hours_slept?: number | null
          id?: string
          notes?: string | null
          quality?: number | null
          sleep_date?: string
          user_id?: string
        }
        Relationships: []
      }
      sponsored_content: {
        Row: {
          budget: number | null
          clicks: number | null
          content_id: string | null
          content_type: string
          created_at: string | null
          end_date: string
          id: string
          impressions: number | null
          is_active: boolean | null
          sponsor_logo: string | null
          sponsor_name: string
          sponsor_url: string | null
          start_date: string
        }
        Insert: {
          budget?: number | null
          clicks?: number | null
          content_id?: string | null
          content_type: string
          created_at?: string | null
          end_date: string
          id?: string
          impressions?: number | null
          is_active?: boolean | null
          sponsor_logo?: string | null
          sponsor_name: string
          sponsor_url?: string | null
          start_date: string
        }
        Update: {
          budget?: number | null
          clicks?: number | null
          content_id?: string | null
          content_type?: string
          created_at?: string | null
          end_date?: string
          id?: string
          impressions?: number | null
          is_active?: boolean | null
          sponsor_logo?: string | null
          sponsor_name?: string
          sponsor_url?: string | null
          start_date?: string
        }
        Relationships: []
      }
      trending_themes: {
        Row: {
          count: number | null
          created_at: string | null
          id: string
          keyword: string
          period_end: string
          period_start: string
        }
        Insert: {
          count?: number | null
          created_at?: string | null
          id?: string
          keyword: string
          period_end: string
          period_start: string
        }
        Update: {
          count?: number | null
          created_at?: string | null
          id?: string
          keyword?: string
          period_end?: string
          period_start?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          badge_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          badge_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          badge_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      user_xp: {
        Row: {
          last_login: string | null
          level: number
          login_streak: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          last_login?: string | null
          level?: number
          login_streak?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          last_login?: string | null
          level?: number
          login_streak?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      view_history: {
        Row: {
          dream_id: string
          id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          dream_id: string
          id?: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          dream_id?: string
          id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "view_history_dream_id_fkey"
            columns: ["dream_id"]
            isOneToOne: false
            referencedRelation: "dreams"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_summaries: {
        Row: {
          created_at: string | null
          id: string
          sent_at: string | null
          summary_text: string | null
          top_keywords: string[] | null
          top_mood: string | null
          total_dreams: number | null
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          sent_at?: string | null
          summary_text?: string | null
          top_keywords?: string[] | null
          top_mood?: string | null
          total_dreams?: number | null
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string | null
          id?: string
          sent_at?: string | null
          summary_text?: string | null
          top_keywords?: string[] | null
          top_mood?: string | null
          total_dreams?: number | null
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_cron_jobs_status: {
        Row: {
          active: boolean | null
          jobid: number | null
          jobname: string | null
          last_http_at: string | null
          last_http_status: string | null
          last_run_completed_at: string | null
          last_run_started_at: string | null
          last_run_status: string | null
          schedule: string | null
        }
        Insert: {
          active?: boolean | null
          jobid?: number | null
          jobname?: string | null
          last_http_at?: never
          last_http_status?: never
          last_run_completed_at?: never
          last_run_started_at?: never
          last_run_status?: never
          schedule?: string | null
        }
        Update: {
          active?: boolean | null
          jobid?: number | null
          jobname?: string | null
          last_http_at?: never
          last_http_status?: never
          last_run_completed_at?: never
          last_run_started_at?: never
          last_run_status?: never
          schedule?: string | null
        }
        Relationships: []
      }
      v_user_leaderboard: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          level: number | null
          login_streak: number | null
          user_id: string | null
          xp: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      bump_drip_enrolled_count: {
        Args: { p_campaign: string; p_delta: number }
        Returns: undefined
      }
      bytea_to_text: { Args: { data: string }; Returns: string }
      cleanup_expired_email_change_requests: { Args: never; Returns: number }
      compute_level: { Args: { p_xp: number }; Returns: number }
      count_search_dreams: { Args: { search_query: string }; Returns: number }
      increment_blog_view_count: { Args: { post_id: string }; Returns: undefined }
      get_dream_category_counts: {
        Args: never
        Returns: {
          category_id: string
          dream_count: number
        }[]
      }
      get_dream_max_stats: {
        Args: never
        Returns: {
          max_likes: number
          max_views: number
        }[]
      }
      get_dream_total_stats: {
        Args: never
        Returns: {
          total_dreams: number
          total_likes: number
          total_views: number
        }[]
      }
      get_letter_counts: {
        Args: never
        Returns: {
          dream_count: number
          letter: string
        }[]
      }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "http_request"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_delete:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_get:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
        SetofOptions: {
          from: "*"
          to: "http_header"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_list_curlopt: {
        Args: never
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_post:
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_reset_curlopt: { Args: never; Returns: boolean }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      invoke_supabase_function: {
        Args: { p_body?: Json; p_url: string }
        Returns: undefined
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      log_admin_action: {
        Args: {
          _action: string
          _details?: Json
          _entity_id?: string
          _entity_title?: string
          _entity_type: string
          _ip_address?: string
          _user_agent?: string
        }
        Returns: string
      }
      normalize_search_text: { Args: { value: string }; Returns: string }
      search_dreams:
        | {
            Args: {
              limit_count?: number
              offset_count?: number
              search_query: string
            }
            Returns: {
              category_id: string
              content: string
              id: string
              keywords: string[] | null
              like_count: number
              rank: number
              slug: string
              title: string
              total_count: number
              view_count: number
            }[]
          }
        | {
            Args: { limit_count?: number; search_query: string }
            Returns: {
              category_id: string
              content: string
              id: string
              keywords: string[] | null
              like_count: number
              rank: number
              slug: string
              title: string
              total_count: number
              view_count: number
            }[]
          }
      set_featured_category: {
        Args: { p_category_id: string }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      text_to_bytea: { Args: { data: string }; Returns: string }
      urlencode:
        | { Args: { data: Json }; Returns: string }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
