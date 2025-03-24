export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      messages: {
        Row: {
          id: number
          chat_id: number
          role: string
          content: string
          created_at: string | null
        }
        Insert: {
          chat_id?: number
          role?: string
          content?: string
          created_at?: string
        }
        Update: {
          chat_id?: number
          role?: string
          content?: string
          created_at?: string
        }
      }
      // Add more tables if needed
    }
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  }
}
