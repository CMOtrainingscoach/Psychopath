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
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          role: "learner" | "admin";
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          role?: "learner" | "admin";
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          role?: "learner" | "admin";
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_stats: {
        Row: {
          user_id: string;
          total_xp: number;
          streak: number;
          last_active: string | null;
          level: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          total_xp?: number;
          streak?: number;
          last_active?: string | null;
          level?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          total_xp?: number;
          streak?: number;
          last_active?: string | null;
          level?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      professors: {
        Row: {
          id: string;
          legacy_key: string | null;
          name: string;
          tagline: string;
          bio: string;
          avatar_config: Json;
          voice_prompt: string;
          sample_phrases: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          legacy_key?: string | null;
          name: string;
          tagline?: string;
          bio?: string;
          avatar_config?: Json;
          voice_prompt?: string;
          sample_phrases?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          legacy_key?: string | null;
          name?: string;
          tagline?: string;
          bio?: string;
          avatar_config?: Json;
          voice_prompt?: string;
          sample_phrases?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          slug: string;
          title: string;
          subtitle: string;
          description: string;
          color: string;
          icon: string;
          order_index: number;
          is_published: boolean;
          default_professor_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          subtitle?: string;
          description?: string;
          color?: string;
          icon?: string;
          order_index?: number;
          is_published?: boolean;
          default_professor_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          subtitle?: string;
          description?: string;
          color?: string;
          icon?: string;
          order_index?: number;
          is_published?: boolean;
          default_professor_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lessons: {
        Row: {
          id: string;
          course_id: string;
          legacy_key: string | null;
          title: string;
          order_index: number;
          professor_id: string | null;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          legacy_key?: string | null;
          title: string;
          order_index?: number;
          professor_id?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          legacy_key?: string | null;
          title?: string;
          order_index?: number;
          professor_id?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chapters: {
        Row: {
          id: string;
          lesson_id: string;
          legacy_key: string | null;
          title: string;
          order_index: number;
          cards: Json;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          legacy_key?: string | null;
          title: string;
          order_index?: number;
          cards?: Json;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          legacy_key?: string | null;
          title?: string;
          order_index?: number;
          cards?: Json;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          owner_type: "chapter" | "lesson";
          owner_id: string;
          order_index: number;
          prompt: string;
          options: Json;
          answer_index: number;
          explanation: string;
          type: "mcq";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_type: "chapter" | "lesson";
          owner_id: string;
          order_index?: number;
          prompt: string;
          options?: Json;
          answer_index: number;
          explanation?: string;
          type?: "mcq";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_type?: "chapter" | "lesson";
          owner_id?: string;
          order_index?: number;
          prompt?: string;
          options?: Json;
          answer_index?: number;
          explanation?: string;
          type?: "mcq";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_chapter_progress: {
        Row: {
          user_id: string;
          chapter_id: string;
          best_score: number;
          xp_earned: number;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          chapter_id: string;
          best_score?: number;
          xp_earned?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          chapter_id?: string;
          best_score?: number;
          xp_earned?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_lesson_progress: {
        Row: {
          user_id: string;
          lesson_id: string;
          best_score: number;
          attempts: number;
          passed: boolean;
          passed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          lesson_id: string;
          best_score?: number;
          attempts?: number;
          passed?: boolean;
          passed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          lesson_id?: string;
          best_score?: number;
          attempts?: number;
          passed?: boolean;
          passed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      generation_jobs: {
        Row: {
          id: string;
          type: string;
          status: "pending" | "running" | "succeeded" | "failed" | "accepted";
          input: Json;
          output: Json | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          status?: "pending" | "running" | "succeeded" | "failed" | "accepted";
          input?: Json;
          output?: Json | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          status?: "pending" | "running" | "succeeded" | "failed" | "accepted";
          input?: Json;
          output?: Json | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      questions_for_learner: {
        Row: {
          id: string | null;
          owner_type: "chapter" | "lesson" | null;
          owner_id: string | null;
          order_index: number | null;
          prompt: string | null;
          options: Json | null;
          explanation: string | null;
          type: "mcq" | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
