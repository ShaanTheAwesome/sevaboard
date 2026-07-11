/**
 * Hand-written types mirroring `supabase/schema.sql`.
 *
 * Once a real Supabase project exists, regenerate this file with:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 * (the generated version will also type relationship/embed queries).
 */

export type UserRole = "admin" | "team_lead" | "member" | "volunteer"
export type TaskStatus = "not_started" | "in_progress" | "done"
export type DesignStatus = "not_started" | "in_progress" | "done" | "approved"
export type DesignPlatform = "irl" | "digital"
export type BudgetType = "income" | "expense"
export type MarketingPlatform = "social_media" | "print" | "banner" | "video" | "website" | "other"
export type MarketingStatus = "not_started" | "in_progress" | "done"
export type SponsorStatus = "lead" | "pending" | "confirmed" | "received"

export type Database = {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string
          name: string
          description: string | null
          lead_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          lead_id?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["departments"]["Insert"]>
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          role: UserRole
          department_id: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          role?: UserRole
          department_id?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
        Relationships: []
      }
      rooms: {
        Row: {
          id: string
          name: string
          sort_order: number
          columns: string[]
          color: string
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number
          columns?: string[]
          color?: string
        }
        Update: Partial<Database["public"]["Tables"]["rooms"]["Insert"]>
        Relationships: []
      }
      program_items: {
        Row: {
          id: string
          room_id: string
          start_time: string
          end_time: string
          activity_name: string
          description: string | null
          assigned_to: string | null
          column_name: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          start_time: string
          end_time: string
          activity_name: string
          description?: string | null
          assigned_to?: string | null
          column_name?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["program_items"]["Insert"]>
        Relationships: []
      }
      room_notes: {
        Row: {
          id: string
          room_id: string
          content: string | null
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          content?: string | null
          updated_by?: string | null
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["room_notes"]["Insert"]>
        Relationships: []
      }
      planning_tasks: {
        Row: {
          id: string
          category: string
          description: string
          week_number: number
          assigned_to: string | null
          status: TaskStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category: string
          description: string
          week_number: number
          assigned_to?: string | null
          status?: TaskStatus
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["planning_tasks"]["Insert"]>
        Relationships: []
      }
      design_items: {
        Row: {
          id: string
          item_name: string
          status: DesignStatus
          platform: DesignPlatform | null
          post_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          item_name: string
          status?: DesignStatus
          platform?: DesignPlatform | null
          post_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["design_items"]["Insert"]>
        Relationships: []
      }
      roster_entries: {
        Row: {
          id: string
          person_id: string | null
          person_name: string | null
          seva_role: string
          time_slot: string | null
          location: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          person_id?: string | null
          person_name?: string | null
          seva_role: string
          time_slot?: string | null
          location?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["roster_entries"]["Insert"]>
        Relationships: []
      }
      budget_entries: {
        Row: {
          id: string
          item: string
          category: string
          amount: number | null
          forecasted_amount: number | null
          entry_date: string
          notes: string | null
          type: BudgetType
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          item: string
          category: string
          amount?: number | null
          forecasted_amount?: number | null
          entry_date: string
          notes?: string | null
          type: BudgetType
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["budget_entries"]["Insert"]>
        Relationships: []
      }
      venue_details: {
        Row: {
          id: number
          venue_name: string | null
          address: string | null
          event_date: string | null
          event_time: string | null
          map_link: string | null
          parking_notes: string | null
          other_notes: string | null
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          venue_name?: string | null
          address?: string | null
          event_date?: string | null
          event_time?: string | null
          map_link?: string | null
          parking_notes?: string | null
          other_notes?: string | null
          updated_by?: string | null
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["venue_details"]["Insert"]>
        Relationships: []
      }
      venue_photos: {
        Row: {
          id: string
          label: string | null
          image_path: string
          sort_order: number
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          label?: string | null
          image_path: string
          sort_order?: number
          created_by?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["venue_photos"]["Insert"]>
        Relationships: []
      }
      marketing_items: {
        Row: {
          id: string
          title: string
          description: string | null
          platform: MarketingPlatform | null
          deadline: string | null
          status: MarketingStatus
          assigned_to: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          platform?: MarketingPlatform | null
          deadline?: string | null
          status?: MarketingStatus
          assigned_to?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["marketing_items"]["Insert"]>
        Relationships: []
      }
      sponsor_categories: {
        Row: {
          id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["sponsor_categories"]["Insert"]>
        Relationships: []
      }
      sponsors: {
        Row: {
          id: string
          company_name: string
          category: string | null
          contact_name: string | null
          contact_phone: string | null
          amount: number | null
          status: SponsorStatus
          person_responsible: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          category?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          amount?: number | null
          status?: SponsorStatus
          person_responsible?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["sponsors"]["Insert"]>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      task_status: TaskStatus
      design_status: DesignStatus
      design_platform: DesignPlatform
      budget_type: BudgetType
      marketing_platform: MarketingPlatform
      marketing_status: MarketingStatus
      sponsor_status: SponsorStatus
    }
    CompositeTypes: Record<string, never>
  }
}
