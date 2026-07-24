export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      candidate_languages: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          language: string
          level: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          language: string
          level: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          language?: string
          level?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_languages_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_profiles: {
        Row: {
          availability: string | null
          bio: string | null
          completion_pct: number
          github_url: string | null
          id: string
          linkedin_url: string | null
          open_to_work: boolean
          preferred_work_modes:
            | Database["public"]["Enums"]["work_mode"][]
            | null
          salary_currency: string
          salary_expectation_max: number | null
          salary_expectation_min: number | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          availability?: string | null
          bio?: string | null
          completion_pct?: number
          github_url?: string | null
          id: string
          linkedin_url?: string | null
          open_to_work?: boolean
          preferred_work_modes?:
            | Database["public"]["Enums"]["work_mode"][]
            | null
          salary_currency?: string
          salary_expectation_max?: number | null
          salary_expectation_min?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          availability?: string | null
          bio?: string | null
          completion_pct?: number
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          open_to_work?: boolean
          preferred_work_modes?:
            | Database["public"]["Enums"]["work_mode"][]
            | null
          salary_currency?: string
          salary_expectation_max?: number | null
          salary_expectation_min?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_skills: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          inferred: boolean
          skill_id: string
          years_experience: number | null
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          inferred?: boolean
          skill_id: string
          years_experience?: number | null
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          inferred?: boolean
          skill_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_skills_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          candidate_id: string
          created_at: string
          credential_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuer: string
          name: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          credential_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuer: string
          name: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          credential_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "certifications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      educations: {
        Row: {
          candidate_id: string
          created_at: string
          degree: string
          end_date: string | null
          field: string | null
          id: string
          institution: string
          start_date: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          degree: string
          end_date?: string | null
          field?: string | null
          id?: string
          institution: string
          start_date: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          degree?: string
          end_date?: string | null
          field?: string | null
          id?: string
          institution?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "educations_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          headline: string | null
          id: string
          location_city: string | null
          location_country: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          headline?: string | null
          id: string
          location_city?: string | null
          location_country?: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          headline?: string | null
          id?: string
          location_city?: string | null
          location_country?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      projects: {
        Row: {
          candidate_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          technologies: string[] | null
          url: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          technologies?: string[] | null
          url?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          technologies?: string[] | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          is_ai_generated: boolean
          name: string
          storage_path: string
          target_job_id: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          is_ai_generated?: boolean
          name: string
          storage_path: string
          target_job_id?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          is_ai_generated?: boolean
          name?: string
          storage_path?: string
          target_job_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resumes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string
          id: string
          name: string
        }
        Insert: {
          category: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      work_experiences: {
        Row: {
          candidate_id: string
          company: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          start_date: string
          technologies: string[] | null
          title: string
        }
        Insert: {
          candidate_id: string
          company: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          start_date: string
          technologies?: string[] | null
          title: string
        }
        Update: {
          candidate_id?: string
          company?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string
          technologies?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_experiences_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      recalculate_passport_completion: {
        Args: { p_candidate_id: string }
        Returns: undefined
      }
    }
    Enums: {
      application_stage:
        | "applied"
        | "under_review"
        | "recruiter_review"
        | "interview"
        | "technical_interview"
        | "final_interview"
        | "offer"
        | "rejected"
      employment_type: "full_time" | "part_time" | "contract" | "internship"
      experience_level:
        | "intern"
        | "junior"
        | "mid"
        | "senior"
        | "staff"
        | "lead"
      notification_type:
        | "application_submitted"
        | "status_changed"
        | "interview_invitation"
        | "offer"
        | "rejection"
        | "feedback_available"
        | "new_matching_job"
      rejection_reason:
        | "insufficient_experience"
        | "missing_technical_skills"
        | "salary_expectations"
        | "language_level"
        | "better_qualified_candidate"
        | "culture_fit"
        | "other"
      user_role: "candidate" | "recruiter"
      work_mode: "remote" | "hybrid" | "onsite"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      application_stage: [
        "applied",
        "under_review",
        "recruiter_review",
        "interview",
        "technical_interview",
        "final_interview",
        "offer",
        "rejected",
      ],
      employment_type: ["full_time", "part_time", "contract", "internship"],
      experience_level: ["intern", "junior", "mid", "senior", "staff", "lead"],
      notification_type: [
        "application_submitted",
        "status_changed",
        "interview_invitation",
        "offer",
        "rejection",
        "feedback_available",
        "new_matching_job",
      ],
      rejection_reason: [
        "insufficient_experience",
        "missing_technical_skills",
        "salary_expectations",
        "language_level",
        "better_qualified_candidate",
        "culture_fit",
        "other",
      ],
      user_role: ["candidate", "recruiter"],
      work_mode: ["remote", "hybrid", "onsite"],
    },
  },
} as const

