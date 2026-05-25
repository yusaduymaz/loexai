/**
 * Database type definitions for the LoexAI Supabase schema.
 *
 * Source of truth: `supabase/migrations/`. The shape of this file mirrors
 * what `npx supabase gen types typescript --local` produces — kept hand-
 * authored in Phase 1 because the local Supabase stack (Docker) is not part
 * of the dev tooling yet. Phase 2 should switch to `gen types` once `npx
 * supabase start` is part of the dev loop; the public API of this module
 * (the `Database` type) will not change.
 *
 * Conventions (matches Supabase CLI output):
 *   - `Row`    — what comes back from SELECT
 *   - `Insert` — payload for INSERT (PK/default columns optional)
 *   - `Update` — partial of Row (all fields optional)
 *
 * Reach for these via:
 *   import type { Database } from '@/types/database'
 *   type Business = Database['public']['Tables']['businesses']['Row']
 */

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
      users: {
        Row: {
          id: string;
          clerk_user_id: string | null;
          email: string;
          role: "user" | "admin";
          credits: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id?: string | null;
          email: string;
          role?: "user" | "admin";
          credits?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          clerk_user_id?: string | null;
          email?: string;
          role?: "user" | "admin";
          credits?: number;
          created_at?: string;
        };
        Relationships: [];
      };

      businesses: {
        Row: {
          id: string;
          user_id: string;
          place_id: string | null;
          source: "google_maps" | "manual" | "import";
          name: string;
          category: string | null;
          address: string | null;
          city: string | null;
          country: string | null;
          phone: string | null;
          website: string | null;
          google_maps_url: string | null;
          rating: number | null;
          review_count: number | null;
          opening_hours: Json | null;
          photos: Json | null;
          social_links: Json | null;
          raw_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          place_id?: string | null;
          source: "google_maps" | "manual" | "import";
          name: string;
          category?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          phone?: string | null;
          website?: string | null;
          google_maps_url?: string | null;
          rating?: number | null;
          review_count?: number | null;
          opening_hours?: Json | null;
          photos?: Json | null;
          social_links?: Json | null;
          raw_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["businesses"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "businesses_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      business_enrichments: {
        Row: {
          id: string;
          business_id: string;
          has_website: boolean | null;
          has_instagram: boolean | null;
          has_reservation_system: boolean | null;
          has_whatsapp_cta: boolean | null;
          mobile_experience: string | null;
          brand_quality: string | null;
          digital_maturity_score: number | null;
          website_status:
            | "ok"
            | "blocked"
            | "timeout"
            | "fetch_failed"
            | "unknown"
            | null;
          enrichment_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          has_website?: boolean | null;
          has_instagram?: boolean | null;
          has_reservation_system?: boolean | null;
          has_whatsapp_cta?: boolean | null;
          mobile_experience?: string | null;
          brand_quality?: string | null;
          digital_maturity_score?: number | null;
          website_status?:
            | "ok"
            | "blocked"
            | "timeout"
            | "fetch_failed"
            | "unknown"
            | null;
          enrichment_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["business_enrichments"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "business_enrichments_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };

      gap_analyses: {
        Row: {
          id: string;
          business_id: string;
          gaps: Json;
          severity_score: number | null;
          summary: string | null;
          template_version: string;
          analysis_version: string;
          evidence: Json;
          expectation_snapshot: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          gaps: Json;
          severity_score?: number | null;
          summary?: string | null;
          template_version?: string;
          analysis_version?: string;
          evidence?: Json;
          expectation_snapshot?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["gap_analyses"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "gap_analyses_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };

      opportunities: {
        Row: {
          id: string;
          business_id: string;
          opportunity_score: number | null;
          priority: "low" | "medium" | "high" | "urgent" | null;
          close_probability: number | null;
          estimated_deal_value_min: number | null;
          estimated_deal_value_max: number | null;
          estimated_deal_value_currency: "USD" | "EUR" | "TRY" | null;
          reasoning: string | null;
          scoring_formula_version: string;
          score_breakdown: Json;
          scored_at: string | null;
          status:
            | "new"
            | "analyzed"
            | "saved"
            | "contacted"
            | "proposal_sent"
            | "won"
            | "lost";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          opportunity_score?: number | null;
          priority?: "low" | "medium" | "high" | "urgent" | null;
          close_probability?: number | null;
          estimated_deal_value_min?: number | null;
          estimated_deal_value_max?: number | null;
          estimated_deal_value_currency?: "USD" | "EUR" | "TRY" | null;
          reasoning?: string | null;
          scoring_formula_version?: string;
          score_breakdown?: Json;
          scored_at?: string | null;
          status?:
            | "new"
            | "analyzed"
            | "saved"
            | "contacted"
            | "proposal_sent"
            | "won"
            | "lost";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["opportunities"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "opportunities_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };

      solution_recommendations: {
        Row: {
          id: string;
          business_id: string;
          opportunity_id: string;
          primary_offer: Json | null;
          secondary_offers: Json | null;
          upsell_offers: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          opportunity_id: string;
          primary_offer?: Json | null;
          secondary_offers?: Json | null;
          upsell_offers?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["solution_recommendations"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "solution_recommendations_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "solution_recommendations_opportunity_id_fkey";
            columns: ["opportunity_id"];
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
        ];
      };

      sales_strategies: {
        Row: {
          id: string;
          business_id: string;
          opportunity_id: string;
          short_pitch: string | null;
          cold_email: string | null;
          instagram_dm: string | null;
          whatsapp_message: string | null;
          discovery_call_opener: string | null;
          objection_handling: Json | null;
          proposal_summary: string | null;
          value_proposition: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          opportunity_id: string;
          short_pitch?: string | null;
          cold_email?: string | null;
          instagram_dm?: string | null;
          whatsapp_message?: string | null;
          discovery_call_opener?: string | null;
          objection_handling?: Json | null;
          proposal_summary?: string | null;
          value_proposition?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sales_strategies"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "sales_strategies_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_strategies_opportunity_id_fkey";
            columns: ["opportunity_id"];
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
        ];
      };

      build_prompts: {
        Row: {
          id: string;
          business_id: string;
          opportunity_id: string;
          prompt_body: string;
          target_tool: "claude" | "cursor" | null;
          tech_stack: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          opportunity_id: string;
          prompt_body: string;
          target_tool?: "claude" | "cursor" | null;
          tech_stack?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["build_prompts"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "build_prompts_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "build_prompts_opportunity_id_fkey";
            columns: ["opportunity_id"];
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
        ];
      };

      scan_jobs: {
        Row: {
          id: string;
          user_id: string;
          location: string;
          category: string;
          radius_m: number;
          status: "queued" | "running" | "completed" | "partial" | "failed";
          found_count: number;
          analyzed_count: number;
          error_count: number;
          error_message: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          location: string;
          category: string;
          radius_m: number;
          status?: "queued" | "running" | "completed" | "partial" | "failed";
          found_count?: number;
          analyzed_count?: number;
          error_count?: number;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["scan_jobs"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "scan_jobs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      scan_job_items: {
        Row: {
          id: string;
          scan_job_id: string;
          business_id: string | null;
          provider: "google_places" | "rapidapi" | "manual";
          provider_place_id: string | null;
          discovery_rank: number | null;
          status: "discovered" | "queued" | "analyzing" | "completed" | "failed" | "skipped";
          raw_result: Json | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scan_job_id: string;
          business_id?: string | null;
          provider: "google_places" | "rapidapi" | "manual";
          provider_place_id?: string | null;
          discovery_rank?: number | null;
          status?: "discovered" | "queued" | "analyzing" | "completed" | "failed" | "skipped";
          raw_result?: Json | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["scan_job_items"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "scan_job_items_scan_job_id_fkey";
            columns: ["scan_job_id"];
            referencedRelation: "scan_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scan_job_items_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };

      pipeline_stage_runs: {
        Row: {
          id: string;
          scan_job_id: string | null;
          scan_job_item_id: string | null;
          business_id: string;
          stage:
            | "discovery"
            | "enrichment"
            | "gap_analysis"
            | "scoring"
            | "solution_recommendation"
            | "sales_strategy"
            | "build_prompt"
            | "qa";
          status: "queued" | "running" | "succeeded" | "failed" | "skipped";
          attempt_number: number;
          provider: string | null;
          model: string | null;
          idempotency_key: string | null;
          input_hash: string | null;
          output_ref: string | null;
          output_summary: Json | null;
          error_code: string | null;
          error_message: string | null;
          metadata: Json;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scan_job_id?: string | null;
          scan_job_item_id?: string | null;
          business_id: string;
          stage:
            | "discovery"
            | "enrichment"
            | "gap_analysis"
            | "scoring"
            | "solution_recommendation"
            | "sales_strategy"
            | "build_prompt"
            | "qa";
          status?: "queued" | "running" | "succeeded" | "failed" | "skipped";
          attempt_number?: number;
          provider?: string | null;
          model?: string | null;
          idempotency_key?: string | null;
          input_hash?: string | null;
          output_ref?: string | null;
          output_summary?: Json | null;
          error_code?: string | null;
          error_message?: string | null;
          metadata?: Json;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pipeline_stage_runs"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "pipeline_stage_runs_scan_job_id_fkey";
            columns: ["scan_job_id"];
            referencedRelation: "scan_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pipeline_stage_runs_scan_job_item_id_fkey";
            columns: ["scan_job_item_id"];
            referencedRelation: "scan_job_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pipeline_stage_runs_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };

      qa_results: {
        Row: {
          id: string;
          business_id: string;
          opportunity_id: string | null;
          scan_job_id: string | null;
          pipeline_stage_run_id: string | null;
          validator_version: string;
          status: "passed" | "warning" | "failed";
          confidence: number | null;
          checks: Json;
          issues: Json;
          evidence: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          opportunity_id?: string | null;
          scan_job_id?: string | null;
          pipeline_stage_run_id?: string | null;
          validator_version?: string;
          status: "passed" | "warning" | "failed";
          confidence?: number | null;
          checks?: Json;
          issues?: Json;
          evidence?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["qa_results"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "qa_results_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "qa_results_opportunity_id_fkey";
            columns: ["opportunity_id"];
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "qa_results_scan_job_id_fkey";
            columns: ["scan_job_id"];
            referencedRelation: "scan_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "qa_results_pipeline_stage_run_id_fkey";
            columns: ["pipeline_stage_run_id"];
            referencedRelation: "pipeline_stage_runs";
            referencedColumns: ["id"];
          },
        ];
      };

      ai_usage: {
        Row: {
          id: string;
          user_id: string;
          business_id: string | null;
          scan_job_id: string | null;
          stage: string;
          model: string;
          provider: "anthropic" | "openrouter_free";
          input_tokens: number;
          output_tokens: number;
          cost_usd: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_id?: string | null;
          scan_job_id?: string | null;
          stage: string;
          model: string;
          provider: "anthropic" | "openrouter_free";
          input_tokens: number;
          output_tokens: number;
          cost_usd?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_usage"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "ai_usage_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_usage_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_usage_scan_job_id_fkey";
            columns: ["scan_job_id"];
            referencedRelation: "scan_jobs";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      decrement_user_credits: {
        Args: { p_user_id: string; p_amount: number };
        Returns: number;
      };
      handle_new_user: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      tg_set_updated_at: {
        Args: Record<string, never>;
        Returns: unknown;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// ─── Convenience type aliases ──────────────────────────────────────────────
// Exported here (not in domain.ts) because they are direct table reflections,
// not cross-phase domain concepts. domain.ts stays minimal per PLAN-1A rule.

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
