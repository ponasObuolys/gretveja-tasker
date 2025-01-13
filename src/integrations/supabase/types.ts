export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attachments: {
        Row: {
          content_type: string
          created_at: string
          created_by: string
          file_name: string
          file_path: string
          id: string
          task_id: string | null
        }
        Insert: {
          content_type: string
          created_at?: string
          created_by: string
          file_name: string
          file_path: string
          id?: string
          task_id?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string
          created_by?: string
          file_name?: string
          file_path?: string
          id?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          role: "ADMIN" | "USER" | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          role?: "ADMIN" | "USER" | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          role?: "ADMIN" | "USER" | null
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          created_by: string
          deadline: string | null
          description: string | null
          id: string
          priority: number | null
          status: "REIKIA_PADARYTI" | "VYKDOMA" | "PADARYTA" | "ATMESTA" | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: number | null
          status?: "REIKIA_PADARYTI" | "VYKDOMA" | "PADARYTA" | "ATMESTA" | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: number | null
          status?: "REIKIA_PADARYTI" | "VYKDOMA" | "PADARYTA" | "ATMESTA" | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      task_comments: {
        Row: {
          attachments: Json | null
          comment: string
          created_at: string | null
          id: string
          links: string[] | null
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          attachments?: Json | null
          comment: string
          created_at?: string | null
          id?: string
          links?: string[] | null
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          attachments?: Json | null
          comment?: string
          created_at?: string | null
          id?: string
          links?: string[] | null
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      task_status: "REIKIA_PADARYTI" | "VYKDOMA" | "PADARYTA" | "ATMESTA"
      user_role: "ADMIN" | "USER"
    }
    CompositeTypes: Record<string, never>
  }
}
