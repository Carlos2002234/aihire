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
      ai_evaluations: {
        Row: {
          application_id: string
          created_at: string
          gaps: string[]
          id: string
          match_score: number
          model: string
          reasoning: string
          skill_analysis: Json
          strengths: string[]
          summary: string
        }
        Insert: {
          application_id: string
          created_at?: string
          gaps?: string[]
          id?: string
          match_score: number
          model: string
          reasoning: string
          skill_analysis?: Json
          strengths?: string[]
          summary: string
        }
        Update: {
          application_id?: string
          created_at?: string
          gaps?: string[]
          id?: string
          match_score?: number
          model?: string
          reasoning?: string
          skill_analysis?: Json
          strengths?: string[]
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_evaluations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_events: {
        Row: {
          actor_id: string | null
          application_id: string
          created_at: string
          from_stage: Database["public"]["Enums"]["application_stage"] | null
          id: string
          note: string | null
          to_stage: Database["public"]["Enums"]["application_stage"]
        }
        Insert: {
          actor_id?: string | null
          application_id: string
          created_at?: string
          from_stage?: Database["public"]["Enums"]["application_stage"] | null
          id?: string
          note?: string | null
          to_stage: Database["public"]["Enums"]["application_stage"]
        }
        Update: {
          actor_id?: string | null
          application_id?: string
          created_at?: string
          from_stage?: Database["public"]["Enums"]["application_stage"] | null
          id?: string
          note?: string | null
          to_stage?: Database["public"]["Enums"]["application_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "application_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          answers: Json | null
          candidate_id: string
          created_at: string
          id: string
          job_id: string
          resume_id: string
          stage: Database["public"]["Enums"]["application_stage"]
          updated_at: string
        }
        Insert: {
          answers?: Json | null
          candidate_id: string
          created_at?: string
          id?: string
          job_id: string
          resume_id: string
          stage?: Database["public"]["Enums"]["application_stage"]
          updated_at?: string
        }
        Update: {
          answers?: Json | null
          candidate_id?: string
          created_at?: string
          id?: string
          job_id?: string
          resume_id?: string
          stage?: Database["public"]["Enums"]["application_stage"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
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
      companies: {
        Row: {
          benefits: string[] | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          industry: string | null
          locations: string[] | null
          logo_url: string | null
          name: string
          photos: string[] | null
          size: string | null
          social: Json | null
          website: string | null
        }
        Insert: {
          benefits?: string[] | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          industry?: string | null
          locations?: string[] | null
          logo_url?: string | null
          name: string
          photos?: string[] | null
          size?: string | null
          social?: Json | null
          website?: string | null
        }
        Update: {
          benefits?: string[] | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          industry?: string | null
          locations?: string[] | null
          logo_url?: string | null
          name?: string
          photos?: string[] | null
          size?: string | null
          social?: Json | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      feedback: {
        Row: {
          ai_message: string
          application_id: string
          areas_to_improve: string[]
          created_at: string
          id: string
          missing_skills: string[]
          recruiter_comment: string | null
          rejection_reason: Database["public"]["Enums"]["rejection_reason"]
          strengths: string[]
        }
        Insert: {
          ai_message: string
          application_id: string
          areas_to_improve?: string[]
          created_at?: string
          id?: string
          missing_skills?: string[]
          recruiter_comment?: string | null
          rejection_reason: Database["public"]["Enums"]["rejection_reason"]
          strengths?: string[]
        }
        Update: {
          ai_message?: string
          application_id?: string
          areas_to_improve?: string[]
          created_at?: string
          id?: string
          missing_skills?: string[]
          recruiter_comment?: string | null
          rejection_reason?: Database["public"]["Enums"]["rejection_reason"]
          strengths?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "feedback_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      job_questions: {
        Row: {
          id: string
          job_id: string
          position: number
          question: string
        }
        Insert: {
          id?: string
          job_id: string
          position: number
          question: string
        }
        Update: {
          id?: string
          job_id?: string
          position?: number
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_questions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_required_skills: {
        Row: {
          id: string
          job_id: string
          language_level: string | null
          min_years: number | null
          required: boolean
          skill_id: string
        }
        Insert: {
          id?: string
          job_id: string
          language_level?: string | null
          min_years?: number | null
          required?: boolean
          skill_id: string
        }
        Update: {
          id?: string
          job_id?: string
          language_level?: string | null
          min_years?: number | null
          required?: boolean
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_required_skills_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_required_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          benefits: string | null
          company_id: string
          created_at: string
          description: string | null
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          id: string
          location_city: string | null
          location_country: string | null
          published_at: string | null
          recruiter_id: string
          responsibilities: string | null
          salary_currency: string
          salary_max: number | null
          salary_min: number | null
          status: string
          title: string
          work_mode: Database["public"]["Enums"]["work_mode"] | null
        }
        Insert: {
          benefits?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          id?: string
          location_city?: string | null
          location_country?: string | null
          published_at?: string | null
          recruiter_id: string
          responsibilities?: string | null
          salary_currency?: string
          salary_max?: number | null
          salary_min?: number | null
          status?: string
          title: string
          work_mode?: Database["public"]["Enums"]["work_mode"] | null
        }
        Update: {
          benefits?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          id?: string
          location_city?: string | null
          location_country?: string | null
          published_at?: string | null
          recruiter_id?: string
          responsibilities?: string | null
          salary_currency?: string
          salary_max?: number | null
          salary_min?: number | null
          status?: string
          title?: string
          work_mode?: Database["public"]["Enums"]["work_mode"] | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "recruiter_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
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
      recruiter_profiles: {
        Row: {
          company_id: string | null
          id: string
          position: string | null
          verified: boolean
        }
        Insert: {
          company_id?: string | null
          id: string
          position?: string | null
          verified?: boolean
        }
        Update: {
          company_id?: string | null
          id?: string
          position?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
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
      roadmap_steps: {
        Row: {
          completed: boolean
          description: string | null
          id: string
          position: number
          roadmap_id: string
          title: string
          type: string
        }
        Insert: {
          completed?: boolean
          description?: string | null
          id?: string
          position: number
          roadmap_id: string
          title: string
          type: string
        }
        Update: {
          completed?: boolean
          description?: string | null
          id?: string
          position?: number
          roadmap_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_steps_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmaps: {
        Row: {
          candidate_id: string
          created_at: string
          feedback_id: string | null
          id: string
          title: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          feedback_id?: string | null
          id?: string
          title: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          feedback_id?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmaps_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmaps_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_jobs: {
        Row: {
          candidate_id: string
          created_at: string
          job_id: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          job_id: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
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
      move_application_stage: {
        Args: {
          p_application_id: string
          p_note?: string
          p_to_stage: Database["public"]["Enums"]["application_stage"]
        }
        Returns: undefined
      }
      recalculate_passport_completion: {
        Args: { p_candidate_id: string }
        Returns: undefined
      }
      reject_application_with_feedback: {
        Args: {
          p_ai_message: string
          p_application_id: string
          p_areas_to_improve: string[]
          p_missing_skills: string[]
          p_recruiter_comment: string
          p_rejection_reason: Database["public"]["Enums"]["rejection_reason"]
          p_strengths: string[]
        }
        Returns: string
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

