/**
 * Database Types
 *
 * These types represent the database schema.
 * In production, generate these types from your Supabase project using:
 * npx supabase gen types typescript --project-id <project-id> > src/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          two_factor_enabled: boolean
          two_factor_secret: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      login_history: {
        Row: {
          id: string
          user_id: string
          login_at: string
          device_type: string | null
          device_info: string | null
          ip_address: string | null
          location: string | null
          success: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          login_at?: string
          device_type?: string | null
          device_info?: string | null
          ip_address?: string | null
          location?: string | null
          success?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          login_at?: string
          device_type?: string | null
          device_info?: string | null
          ip_address?: string | null
          location?: string | null
          success?: boolean
          created_at?: string
        }
      }
      active_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          device_type: string | null
          device_info: string | null
          ip_address: string | null
          created_at: string
          last_active: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          session_token: string
          device_type?: string | null
          device_info?: string | null
          ip_address?: string | null
          created_at?: string
          last_active?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          session_token?: string
          device_type?: string | null
          device_info?: string | null
          ip_address?: string | null
          created_at?: string
          last_active?: string
          expires_at?: string | null
        }
      }
      todo_lists: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          color: string
          icon: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          color?: string
          icon?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          color?: string
          icon?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      todos: {
        Row: {
          id: string
          user_id: string
          list_id: string | null
          title: string
          description: string | null
          completed: boolean
          priority: 'low' | 'medium' | 'high' | 'urgent' | null
          due_date: string | null
          completed_at: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          list_id?: string | null
          title: string
          description?: string | null
          completed?: boolean
          priority?: 'low' | 'medium' | 'high' | 'urgent' | null
          due_date?: string | null
          completed_at?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          list_id?: string | null
          title?: string
          description?: string | null
          completed?: boolean
          priority?: 'low' | 'medium' | 'high' | 'urgent' | null
          due_date?: string | null
          completed_at?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      transaction_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'income' | 'expense'
          color: string
          icon: string | null
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'income' | 'expense'
          color?: string
          icon?: string | null
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'income' | 'expense'
          color?: string
          icon?: string | null
          is_default?: boolean
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          type: 'income' | 'expense'
          amount: number
          description: string | null
          transaction_date: string
          recurring_transaction_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          type: 'income' | 'expense'
          amount: number
          description?: string | null
          transaction_date: string
          recurring_transaction_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string | null
          type?: 'income' | 'expense'
          amount?: number
          description?: string | null
          transaction_date?: string
          recurring_transaction_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      recurring_transactions: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          type: 'income' | 'expense'
          amount: number
          description: string | null
          frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
          start_date: string
          end_date: string | null
          next_occurrence: string
          is_active: boolean
          remind_days_before: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          type: 'income' | 'expense'
          amount: number
          description?: string | null
          frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
          start_date: string
          end_date?: string | null
          next_occurrence: string
          is_active?: boolean
          remind_days_before?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string | null
          type?: 'income' | 'expense'
          amount?: number
          description?: string | null
          frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
          start_date?: string
          end_date?: string | null
          next_occurrence?: string
          is_active?: boolean
          remind_days_before?: number
          created_at?: string
          updated_at?: string
        }
      }
      transaction_reminders: {
        Row: {
          id: string
          user_id: string
          recurring_transaction_id: string
          reminder_date: string
          sent: boolean
          dismissed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recurring_transaction_id: string
          reminder_date: string
          sent?: boolean
          dismissed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recurring_transaction_id?: string
          reminder_date?: string
          sent?: boolean
          dismissed?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
