export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type GeoPoint = {
  type: 'Point';
  coordinates: [number, number];
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: Database['public']['Enums']['user_role'];
          phone_number: string;
          full_name: string;
          avatar_url: string | null;
          fcm_token: string | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          role: Database['public']['Enums']['user_role'];
          phone_number: string;
          full_name: string;
          avatar_url?: string | null;
          fcm_token?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          role?: Database['public']['Enums']['user_role'];
          phone_number?: string;
          full_name?: string;
          avatar_url?: string | null;
          fcm_token?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      pro_details: {
        Row: {
          pro_id: string;
          aadhaar_ref: string | null;
          liveness_verified: boolean | null;
          ai_skill_score: number | null;
          interview_transcript: Json | null;
          tools_verified: boolean | null;
          tools_missing: string[] | null;
          current_location: GeoPoint | null;
          service_radius_km: number | null;
          decline_count: number | null;
          interview_locked_until: string | null;
          kyc_status: Database['public']['Enums']['kyc_status'] | null;
          bank_account_ref: string | null;
          onboarding_step: Database['public']['Enums']['onboarding_step'] | null;
        };
        Insert: {
          pro_id: string;
          aadhaar_ref?: string | null;
          liveness_verified?: boolean | null;
          ai_skill_score?: number | null;
          interview_transcript?: Json | null;
          tools_verified?: boolean | null;
          tools_missing?: string[] | null;
          current_location?: GeoPoint | null;
          service_radius_km?: number | null;
          decline_count?: number | null;
          interview_locked_until?: string | null;
          kyc_status?: Database['public']['Enums']['kyc_status'] | null;
          bank_account_ref?: string | null;
          onboarding_step?: Database['public']['Enums']['onboarding_step'] | null;
        };
        Update: {
          pro_id?: string;
          aadhaar_ref?: string | null;
          liveness_verified?: boolean | null;
          ai_skill_score?: number | null;
          interview_transcript?: Json | null;
          tools_verified?: boolean | null;
          tools_missing?: string[] | null;
          current_location?: GeoPoint | null;
          service_radius_km?: number | null;
          decline_count?: number | null;
          interview_locked_until?: string | null;
          kyc_status?: Database['public']['Enums']['kyc_status'] | null;
          bank_account_ref?: string | null;
          onboarding_step?: Database['public']['Enums']['onboarding_step'] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pro_details_pro_id_fkey';
            columns: ['pro_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      pro_availability: {
        Row: {
          pro_id: string;
          is_online: boolean | null;
          last_ping: string | null;
          current_job_id: string | null;
          availability_hours: Json | null;
        };
        Insert: {
          pro_id: string;
          is_online?: boolean | null;
          last_ping?: string | null;
          current_job_id?: string | null;
          availability_hours?: Json | null;
        };
        Update: {
          pro_id?: string;
          is_online?: boolean | null;
          last_ping?: string | null;
          current_job_id?: string | null;
          availability_hours?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pro_availability_current_job_id_fkey';
            columns: ['current_job_id'];
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pro_availability_pro_id_fkey';
            columns: ['pro_id'];
            referencedRelation: 'pro_details';
            referencedColumns: ['pro_id'];
          }
        ];
      };
      catalog_skills: {
        Row: {
          id: string;
          trade: string;
          skill_name: string;
          skill_vector: number[] | null;
          is_active: boolean | null;
        };
        Insert: {
          id?: string;
          trade: string;
          skill_name: string;
          skill_vector?: number[] | null;
          is_active?: boolean | null;
        };
        Update: {
          id?: string;
          trade?: string;
          skill_name?: string;
          skill_vector?: number[] | null;
          is_active?: boolean | null;
        };
        Relationships: [];
      };
      catalog_parts: {
        Row: {
          id: string;
          category: string;
          part_name: string;
          part_number: string | null;
          avg_price_inr: number | null;
          is_active: boolean | null;
        };
        Insert: {
          id?: string;
          category: string;
          part_name: string;
          part_number?: string | null;
          avg_price_inr?: number | null;
          is_active?: boolean | null;
        };
        Update: {
          id?: string;
          category?: string;
          part_name?: string;
          part_number?: string | null;
          avg_price_inr?: number | null;
          is_active?: boolean | null;
        };
        Relationships: [];
      };
      service_areas: {
        Row: {
          id: string;
          city: string;
          area_name: string;
          pincode: string;
          is_active: boolean | null;
        };
        Insert: {
          id?: string;
          city: string;
          area_name: string;
          pincode: string;
          is_active?: boolean | null;
        };
        Update: {
          id?: string;
          city?: string;
          area_name?: string;
          pincode?: string;
          is_active?: boolean | null;
        };
        Relationships: [];
      };
      pro_skills: {
        Row: {
          pro_id: string;
          skill_id: string;
          years_exp: number | null;
          verified_at: string | null;
        };
        Insert: {
          pro_id: string;
          skill_id: string;
          years_exp?: number | null;
          verified_at?: string | null;
        };
        Update: {
          pro_id?: string;
          skill_id?: string;
          years_exp?: number | null;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pro_skills_pro_id_fkey';
            columns: ['pro_id'];
            referencedRelation: 'pro_details';
            referencedColumns: ['pro_id'];
          },
          {
            foreignKeyName: 'pro_skills_skill_id_fkey';
            columns: ['skill_id'];
            referencedRelation: 'catalog_skills';
            referencedColumns: ['id'];
          }
        ];
      };
      pro_inventory: {
        Row: {
          pro_id: string;
          part_id: string;
          quantity: number | null;
          last_updated: string | null;
        };
        Insert: {
          pro_id: string;
          part_id: string;
          quantity?: number | null;
          last_updated?: string | null;
        };
        Update: {
          pro_id?: string;
          part_id?: string;
          quantity?: number | null;
          last_updated?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pro_inventory_part_id_fkey';
            columns: ['part_id'];
            referencedRelation: 'catalog_parts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pro_inventory_pro_id_fkey';
            columns: ['pro_id'];
            referencedRelation: 'pro_details';
            referencedColumns: ['pro_id'];
          }
        ];
      };
      customer_addresses: {
        Row: {
          id: string;
          customer_id: string | null;
          label: string | null;
          address_text: string;
          location: GeoPoint | null;
          is_default: boolean | null;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          label?: string | null;
          address_text: string;
          location?: GeoPoint | null;
          is_default?: boolean | null;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          label?: string | null;
          address_text?: string;
          location?: GeoPoint | null;
          is_default?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'customer_addresses_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      jobs: {
        Row: {
          id: string;
          customer_id: string | null;
          pro_id: string | null;
          status: Database['public']['Enums']['job_status'] | null;
          ai_diagnosis: string | null;
          ai_confidence: number | null;
          ai_raw_response: Json | null;
          required_skill_id: string | null;
          required_part_id: string | null;
          est_cost_min: number | null;
          est_cost_max: number | null;
          final_cost: number | null;
          escrow_amount: number | null;
          rzp_order_id: string | null;
          rzp_payment_id: string | null;
          address_id: string | null;
          job_location: GeoPoint | null;
          customer_problem_text: string | null;
          diagnosis_feedback: boolean | null;
          created_at: string | null;
          matched_at: string | null;
          arrived_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          pro_id?: string | null;
          status?: Database['public']['Enums']['job_status'] | null;
          ai_diagnosis?: string | null;
          ai_confidence?: number | null;
          ai_raw_response?: Json | null;
          required_skill_id?: string | null;
          required_part_id?: string | null;
          est_cost_min?: number | null;
          est_cost_max?: number | null;
          final_cost?: number | null;
          escrow_amount?: number | null;
          rzp_order_id?: string | null;
          rzp_payment_id?: string | null;
          address_id?: string | null;
          job_location?: GeoPoint | null;
          customer_problem_text?: string | null;
          diagnosis_feedback?: boolean | null;
          created_at?: string | null;
          matched_at?: string | null;
          arrived_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          pro_id?: string | null;
          status?: Database['public']['Enums']['job_status'] | null;
          ai_diagnosis?: string | null;
          ai_confidence?: number | null;
          ai_raw_response?: Json | null;
          required_skill_id?: string | null;
          required_part_id?: string | null;
          est_cost_min?: number | null;
          est_cost_max?: number | null;
          final_cost?: number | null;
          escrow_amount?: number | null;
          rzp_order_id?: string | null;
          rzp_payment_id?: string | null;
          address_id?: string | null;
          job_location?: GeoPoint | null;
          customer_problem_text?: string | null;
          diagnosis_feedback?: boolean | null;
          created_at?: string | null;
          matched_at?: string | null;
          arrived_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'jobs_address_id_fkey';
            columns: ['address_id'];
            referencedRelation: 'customer_addresses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_pro_id_fkey';
            columns: ['pro_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_required_part_id_fkey';
            columns: ['required_part_id'];
            referencedRelation: 'catalog_parts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_required_skill_id_fkey';
            columns: ['required_skill_id'];
            referencedRelation: 'catalog_skills';
            referencedColumns: ['id'];
          }
        ];
      };
      matching_log: {
        Row: {
          id: string;
          job_id: string | null;
          pro_id: string | null;
          match_score: number | null;
          distance_km: number | null;
          skill_score_at_match: number | null;
          had_required_part: boolean | null;
          outcome: Database['public']['Enums']['matching_outcome'] | null;
          assigned_at: string | null;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          job_id?: string | null;
          pro_id?: string | null;
          match_score?: number | null;
          distance_km?: number | null;
          skill_score_at_match?: number | null;
          had_required_part?: boolean | null;
          outcome?: Database['public']['Enums']['matching_outcome'] | null;
          assigned_at?: string | null;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          job_id?: string | null;
          pro_id?: string | null;
          match_score?: number | null;
          distance_km?: number | null;
          skill_score_at_match?: number | null;
          had_required_part?: boolean | null;
          outcome?: Database['public']['Enums']['matching_outcome'] | null;
          assigned_at?: string | null;
          responded_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'matching_log_job_id_fkey';
            columns: ['job_id'];
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matching_log_pro_id_fkey';
            columns: ['pro_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      media_assets: {
        Row: {
          id: string;
          entity_id: string;
          entity_type: Database['public']['Enums']['entity_type'];
          storage_url: string;
          ai_verified: boolean | null;
          ai_result: Json | null;
          uploaded_at: string | null;
        };
        Insert: {
          id?: string;
          entity_id: string;
          entity_type: Database['public']['Enums']['entity_type'];
          storage_url: string;
          ai_verified?: boolean | null;
          ai_result?: Json | null;
          uploaded_at?: string | null;
        };
        Update: {
          id?: string;
          entity_id?: string;
          entity_type?: Database['public']['Enums']['entity_type'];
          storage_url?: string;
          ai_verified?: boolean | null;
          ai_result?: Json | null;
          uploaded_at?: string | null;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          job_id: string | null;
          line_items: Json;
          subtotal: number;
          gst_amount: number;
          total_amount: number;
          ai_generated: boolean | null;
          pdf_url: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          job_id?: string | null;
          line_items: Json;
          subtotal: number;
          gst_amount: number;
          total_amount: number;
          ai_generated?: boolean | null;
          pdf_url?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          job_id?: string | null;
          line_items?: Json;
          subtotal?: number;
          gst_amount?: number;
          total_amount?: number;
          ai_generated?: boolean | null;
          pdf_url?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'invoices_job_id_fkey';
            columns: ['job_id'];
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          }
        ];
      };
      warranties: {
        Row: {
          id: string;
          job_id: string | null;
          pro_id: string | null;
          valid_until: string;
          status: Database['public']['Enums']['warranty_status'] | null;
          claimed_at: string | null;
        };
        Insert: {
          id?: string;
          job_id?: string | null;
          pro_id?: string | null;
          valid_until: string;
          status?: Database['public']['Enums']['warranty_status'] | null;
          claimed_at?: string | null;
        };
        Update: {
          id?: string;
          job_id?: string | null;
          pro_id?: string | null;
          valid_until?: string;
          status?: Database['public']['Enums']['warranty_status'] | null;
          claimed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'warranties_job_id_fkey';
            columns: ['job_id'];
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warranties_pro_id_fkey';
            columns: ['pro_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      reviews: {
        Row: {
          id: string;
          job_id: string | null;
          reviewer_id: string | null;
          reviewee_id: string | null;
          rating: number | null;
          comment: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          job_id?: string | null;
          reviewer_id?: string | null;
          reviewee_id?: string | null;
          rating?: number | null;
          comment?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          job_id?: string | null;
          reviewer_id?: string | null;
          reviewee_id?: string | null;
          rating?: number | null;
          comment?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reviews_job_id_fkey';
            columns: ['job_id'];
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_reviewee_id_fkey';
            columns: ['reviewee_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_reviewer_id_fkey';
            columns: ['reviewer_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      dispute_logs: {
        Row: {
          id: string;
          job_id: string | null;
          raised_by: string | null;
          reason: string;
          ai_diagnosis_wrong: boolean | null;
          actual_fault: string | null;
          status: Database['public']['Enums']['dispute_status'] | null;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          job_id?: string | null;
          raised_by?: string | null;
          reason: string;
          ai_diagnosis_wrong?: boolean | null;
          actual_fault?: string | null;
          status?: Database['public']['Enums']['dispute_status'] | null;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          job_id?: string | null;
          raised_by?: string | null;
          reason?: string;
          ai_diagnosis_wrong?: boolean | null;
          actual_fault?: string | null;
          status?: Database['public']['Enums']['dispute_status'] | null;
          resolved_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'dispute_logs_job_id_fkey';
            columns: ['job_id'];
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dispute_logs_raised_by_fkey';
            columns: ['raised_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          type: Database['public']['Enums']['notification_type'];
          title: string;
          body: string;
          is_read: boolean | null;
          deep_link: string | null;
          job_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type: Database['public']['Enums']['notification_type'];
          title: string;
          body: string;
          is_read?: boolean | null;
          deep_link?: string | null;
          job_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          type?: Database['public']['Enums']['notification_type'];
          title?: string;
          body?: string;
          is_read?: boolean | null;
          deep_link?: string | null;
          job_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_job_id_fkey';
            columns: ['job_id'];
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      appliances: {
        Row: {
          id: string;
          customer_id: string | null;
          type: string;
          brand: string | null;
          model: string | null;
          purchase_date: string | null;
          last_serviced_at: string | null;
          next_service_due: string | null;
          health_score: number | null;
          job_count: number | null;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          type: string;
          brand?: string | null;
          model?: string | null;
          purchase_date?: string | null;
          last_serviced_at?: string | null;
          next_service_due?: string | null;
          health_score?: number | null;
          job_count?: number | null;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          type?: string;
          brand?: string | null;
          model?: string | null;
          purchase_date?: string | null;
          last_serviced_at?: string | null;
          next_service_due?: string | null;
          health_score?: number | null;
          job_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'appliances_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      earnings: {
        Row: {
          id: string;
          pro_id: string | null;
          job_id: string | null;
          gross_amount: number;
          commission_amount: number;
          net_payout: number;
          rzp_payout_id: string | null;
          paid_at: string | null;
        };
        Insert: {
          id?: string;
          pro_id?: string | null;
          job_id?: string | null;
          gross_amount: number;
          commission_amount: number;
          net_payout: number;
          rzp_payout_id?: string | null;
          paid_at?: string | null;
        };
        Update: {
          id?: string;
          pro_id?: string | null;
          job_id?: string | null;
          gross_amount?: number;
          commission_amount?: number;
          net_payout?: number;
          rzp_payout_id?: string | null;
          paid_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'earnings_job_id_fkey';
            columns: ['job_id'];
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'earnings_pro_id_fkey';
            columns: ['pro_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      user_role: 'customer' | 'pro';
      job_status:
        | 'triage'
        | 'searching'
        | 'matched'
        | 'in_transit'
        | 'arrived'
        | 'working'
        | 'completed'
        | 'disputed'
        | 'cancelled';
      entity_type: 'job_before' | 'job_after' | 'pro_toolkit' | 'pro_selfie' | 'pro_aadhaar';
      notification_type: 'job_update' | 'payment' | 'warranty_expiry' | 'promo';
      warranty_status: 'active' | 'expired' | 'claimed';
      dispute_status: 'open' | 'resolved' | 'refunded';
      kyc_status: 'pending' | 'verified' | 'failed';
      matching_outcome: 'accepted' | 'declined' | 'timeout';
      onboarding_step: 'identity' | 'skills' | 'interview' | 'toolkit' | 'inventory' | 'complete';
    };
    CompositeTypes: {};
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
