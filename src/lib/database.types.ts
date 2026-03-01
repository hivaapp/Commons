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
        PostgrestVersion: "14.4"
    }
    public: {
        Tables: {
            brand_profiles: {
                Row: {
                    company_logo_url: string | null
                    company_name: string
                    created_at: string | null
                    id: string
                    industry: string | null
                    is_active: boolean | null
                    is_verified: boolean | null
                    reputation_score: number | null
                    total_campaigns: number | null
                    total_spent_paise: number | null
                    updated_at: string | null
                    website: string | null
                }
                Insert: {
                    company_logo_url?: string | null
                    company_name: string
                    created_at?: string | null
                    id: string
                    industry?: string | null
                    is_active?: boolean | null
                    is_verified?: boolean | null
                    reputation_score?: number | null
                    total_campaigns?: number | null
                    total_spent_paise?: number | null
                    updated_at?: string | null
                    website?: string | null
                }
                Update: {
                    company_logo_url?: string | null
                    company_name?: string
                    created_at?: string | null
                    id?: string
                    industry?: string | null
                    is_active?: boolean | null
                    is_verified?: boolean | null
                    reputation_score?: number | null
                    total_campaigns?: number | null
                    total_spent_paise?: number | null
                    updated_at?: string | null
                    website?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "brand_profiles_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            campaign_invitations: {
                Row: {
                    campaign_id: string | null
                    created_at: string | null
                    creator_fee_paise: number | null
                    creator_id: string | null
                    id: string
                    match_score: number | null
                    responded_at: string | null
                    status: string | null
                }
                Insert: {
                    campaign_id?: string | null
                    created_at?: string | null
                    creator_fee_paise?: number | null
                    creator_id?: string | null
                    id?: string
                    match_score?: number | null
                    responded_at?: string | null
                    status?: string | null
                }
                Update: {
                    campaign_id?: string | null
                    created_at?: string | null
                    creator_fee_paise?: number | null
                    creator_id?: string | null
                    id?: string
                    match_score?: number | null
                    responded_at?: string | null
                    status?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "campaign_invitations_campaign_id_fkey"
                        columns: ["campaign_id"]
                        isOneToOne: false
                        referencedRelation: "campaigns"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "campaign_invitations_creator_id_fkey"
                        columns: ["creator_id"]
                        isOneToOne: false
                        referencedRelation: "creator_profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            campaigns: {
                Row: {
                    accepted_submissions: number | null
                    brand_brief: Json | null
                    brand_id: string
                    budget_paise: number
                    campaign_type: Database["public"]["Enums"]["campaign_type"]
                    completed_at: string | null
                    created_at: string | null
                    creator_fee_paise: number | null
                    creator_fee_rate: number | null
                    creator_id: string | null
                    current_participants: number | null
                    description: string
                    ends_at: string | null
                    escrow_funded_at: string | null
                    stripe_payment_intent_id: string | null
                    id: string
                    per_task_paise: number
                    platform_fee_paise: number | null
                    proof_required: boolean | null
                    proof_type: string | null
                    required_geo: string[] | null
                    starts_at: string | null
                    status: Database["public"]["Enums"]["campaign_status"] | null
                    tags: string[] | null
                    target_participants: number
                    task_duration_minutes: number
                    task_instructions: string
                    task_min_seconds: number
                    title: string
                    updated_at: string | null
                }
                Insert: {
                    accepted_submissions?: number | null
                    brand_brief?: Json | null
                    brand_id: string
                    budget_paise: number
                    campaign_type: Database["public"]["Enums"]["campaign_type"]
                    completed_at?: string | null
                    created_at?: string | null
                    creator_fee_paise?: number | null
                    creator_fee_rate?: number | null
                    creator_id?: string | null
                    current_participants?: number | null
                    description: string
                    ends_at?: string | null
                    escrow_funded_at?: string | null
                    stripe_payment_intent_id?: string | null
                    id?: string
                    per_task_paise: number
                    platform_fee_paise?: number | null
                    proof_required?: boolean | null
                    proof_type?: string | null
                    required_geo?: string[] | null
                    starts_at?: string | null
                    status?: Database["public"]["Enums"]["campaign_status"] | null
                    tags?: string[] | null
                    target_participants: number
                    task_duration_minutes: number
                    task_instructions: string
                    task_min_seconds: number
                    title: string
                    updated_at?: string | null
                }
                Update: {
                    accepted_submissions?: number | null
                    brand_brief?: Json | null
                    brand_id?: string
                    budget_paise?: number
                    campaign_type?: Database["public"]["Enums"]["campaign_type"]
                    completed_at?: string | null
                    created_at?: string | null
                    creator_fee_paise?: number | null
                    creator_fee_rate?: number | null
                    creator_id?: string | null
                    current_participants?: number | null
                    description?: string
                    ends_at?: string | null
                    escrow_funded_at?: string | null
                    stripe_payment_intent_id?: string | null
                    id?: string
                    per_task_paise?: number
                    platform_fee_paise?: number | null
                    proof_required?: boolean | null
                    proof_type?: string | null
                    required_geo?: string[] | null
                    starts_at?: string | null
                    status?: Database["public"]["Enums"]["campaign_status"] | null
                    tags?: string[] | null
                    target_participants?: number
                    task_duration_minutes?: number
                    task_instructions?: string
                    task_min_seconds?: number
                    title?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "campaigns_brand_id_fkey"
                        columns: ["brand_id"]
                        isOneToOne: false
                        referencedRelation: "brand_profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "campaigns_creator_id_fkey"
                        columns: ["creator_id"]
                        isOneToOne: false
                        referencedRelation: "creator_profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            community_profiles: {
                Row: {
                    bank_account: Json | null
                    blocked_brands: string[] | null
                    blocked_categories:
                    | Database["public"]["Enums"]["campaign_type"][]
                    | null
                    consecutive_accepted: number | null
                    created_at: string | null
                    fraud_flags: number | null
                    id: string
                    is_banned: boolean | null
                    quality_score: number | null
                    total_earned_paise: number | null
                    total_tasks_completed: number | null
                    total_tasks_rejected: number | null
                    updated_at: string | null
                    upi_id: string | null
                }
                Insert: {
                    bank_account?: Json | null
                    blocked_brands?: string[] | null
                    blocked_categories?:
                    | Database["public"]["Enums"]["campaign_type"][]
                    | null
                    consecutive_accepted?: number | null
                    created_at?: string | null
                    fraud_flags?: number | null
                    id: string
                    is_banned?: boolean | null
                    quality_score?: number | null
                    total_earned_paise?: number | null
                    total_tasks_completed?: number | null
                    total_tasks_rejected?: number | null
                    updated_at?: string | null
                    upi_id?: string | null
                }
                Update: {
                    bank_account?: Json | null
                    blocked_brands?: string[] | null
                    blocked_categories?:
                    | Database["public"]["Enums"]["campaign_type"][]
                    | null
                    consecutive_accepted?: number | null
                    created_at?: string | null
                    fraud_flags?: number | null
                    id?: string
                    is_banned?: boolean | null
                    quality_score?: number | null
                    total_earned_paise?: number | null
                    total_tasks_completed?: number | null
                    total_tasks_rejected?: number | null
                    updated_at?: string | null
                    upi_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "community_profiles_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            creator_profiles: {
                Row: {
                    activation_rate: number | null
                    audience_geo: Json | null
                    audience_size_total: number | null
                    bio: string | null
                    created_at: string | null
                    handle: string
                    id: string
                    is_active: boolean | null
                    min_campaign_budget_paise: number | null
                    niche_primary: string | null
                    niches: string[] | null
                    onboarding_step: number | null
                    pilot_completed: boolean | null
                    social_links: Json | null
                    task_acceptance_rate: number | null
                    tier: Database["public"]["Enums"]["creator_tier"] | null
                    total_campaigns: number | null
                    total_earned_paise: number | null
                    trust_score: number | null
                    updated_at: string | null
                    verified: boolean | null
                }
                Insert: {
                    activation_rate?: number | null
                    audience_geo?: Json | null
                    audience_size_total?: number | null
                    bio?: string | null
                    created_at?: string | null
                    handle: string
                    id: string
                    is_active?: boolean | null
                    min_campaign_budget_paise?: number | null
                    niche_primary?: string | null
                    niches?: string[] | null
                    onboarding_step?: number | null
                    pilot_completed?: boolean | null
                    social_links?: Json | null
                    task_acceptance_rate?: number | null
                    tier?: Database["public"]["Enums"]["creator_tier"] | null
                    total_campaigns?: number | null
                    total_earned_paise?: number | null
                    trust_score?: number | null
                    updated_at?: string | null
                    verified?: boolean | null
                }
                Update: {
                    activation_rate?: number | null
                    audience_geo?: Json | null
                    audience_size_total?: number | null
                    bio?: string | null
                    created_at?: string | null
                    handle?: string
                    id?: string
                    is_active?: boolean | null
                    min_campaign_budget_paise?: number | null
                    niche_primary?: string | null
                    niches?: string[] | null
                    onboarding_step?: number | null
                    pilot_completed?: boolean | null
                    social_links?: Json | null
                    task_acceptance_rate?: number | null
                    tier?: Database["public"]["Enums"]["creator_tier"] | null
                    total_campaigns?: number | null
                    total_earned_paise?: number | null
                    trust_score?: number | null
                    updated_at?: string | null
                    verified?: boolean | null
                }
                Relationships: [
                    {
                        foreignKeyName: "creator_profiles_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            fraud_flags: {
                Row: {
                    auto_detected: boolean | null
                    created_at: string | null
                    details: Json | null
                    flag_type: string | null
                    id: string
                    participant_id: string | null
                    resolved: boolean | null
                    task_id: string | null
                }
                Insert: {
                    auto_detected?: boolean | null
                    created_at?: string | null
                    details?: Json | null
                    flag_type?: string | null
                    id?: string
                    participant_id?: string | null
                    resolved?: boolean | null
                    task_id?: string | null
                }
                Update: {
                    auto_detected?: boolean | null
                    created_at?: string | null
                    details?: Json | null
                    flag_type?: string | null
                    id?: string
                    participant_id?: string | null
                    resolved?: boolean | null
                    task_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "fraud_flags_participant_id_fkey"
                        columns: ["participant_id"]
                        isOneToOne: false
                        referencedRelation: "community_profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "fraud_flags_task_id_fkey"
                        columns: ["task_id"]
                        isOneToOne: false
                        referencedRelation: "tasks"
                        referencedColumns: ["id"]
                    },
                ]
            }
            notifications: {
                Row: {
                    body: string | null
                    created_at: string | null
                    data: Json | null
                    id: string
                    read: boolean | null
                    title: string | null
                    type: string | null
                    user_id: string | null
                }
                Insert: {
                    body?: string | null
                    created_at?: string | null
                    data?: Json | null
                    id?: string
                    read?: boolean | null
                    title?: string | null
                    type?: string | null
                    user_id?: string | null
                }
                Update: {
                    body?: string | null
                    created_at?: string | null
                    data?: Json | null
                    id?: string
                    read?: boolean | null
                    title?: string | null
                    type?: string | null
                    user_id?: string | null
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
            payouts: {
                Row: {
                    amount_paise: number
                    campaign_id: string | null
                    completed_at: string | null
                    created_at: string | null
                    failed_at: string | null
                    failure_reason: string | null
                    id: string
                    initiated_at: string | null
                    stripe_transfer_id: string | null
                    recipient_id: string | null
                    recipient_role: Database["public"]["Enums"]["user_role"] | null
                    status: Database["public"]["Enums"]["payout_status"] | null
                    upi_id: string | null
                }
                Insert: {
                    amount_paise: number
                    campaign_id?: string | null
                    completed_at?: string | null
                    created_at?: string | null
                    failed_at?: string | null
                    failure_reason?: string | null
                    id?: string
                    initiated_at?: string | null
                    stripe_transfer_id?: string | null
                    recipient_id?: string | null
                    recipient_role?: Database["public"]["Enums"]["user_role"] | null
                    status?: Database["public"]["Enums"]["payout_status"] | null
                    upi_id?: string | null
                }
                Update: {
                    amount_paise?: number
                    campaign_id?: string | null
                    completed_at?: string | null
                    created_at?: string | null
                    failed_at?: string | null
                    failure_reason?: string | null
                    id?: string
                    initiated_at?: string | null
                    stripe_transfer_id?: string | null
                    recipient_id?: string | null
                    recipient_role?: Database["public"]["Enums"]["user_role"] | null
                    status?: Database["public"]["Enums"]["payout_status"] | null
                    upi_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "payouts_campaign_id_fkey"
                        columns: ["campaign_id"]
                        isOneToOne: false
                        referencedRelation: "campaigns"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "payouts_recipient_id_fkey"
                        columns: ["recipient_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    created_at: string | null
                    email: string | null
                    full_name: string | null
                    id: string
                    phone: string | null
                    phone_verified: boolean | null
                    role: Database["public"]["Enums"]["user_role"] | null
                    updated_at: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string | null
                    email?: string | null
                    full_name?: string | null
                    id: string
                    phone?: string | null
                    phone_verified?: boolean | null
                    role?: Database["public"]["Enums"]["user_role"] | null
                    updated_at?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string | null
                    email?: string | null
                    full_name?: string | null
                    id?: string
                    phone?: string | null
                    phone_verified?: boolean | null
                    role?: Database["public"]["Enums"]["user_role"] | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            tasks: {
                Row: {
                    campaign_id: string
                    created_at: string | null
                    id: string
                    is_spot_checked: boolean | null
                    participant_id: string
                    payout_amount_paise: number | null
                    proof_urls: string[] | null
                    quality_score: number | null
                    rejection_category: string | null
                    rejection_reason: string | null
                    responses: Json | null
                    reviewed_at: string | null
                    started_at: string | null
                    status: Database["public"]["Enums"]["task_status"] | null
                    submitted_at: string | null
                    time_spent_seconds: number | null
                    updated_at: string | null
                }
                Insert: {
                    campaign_id: string
                    created_at?: string | null
                    id?: string
                    is_spot_checked?: boolean | null
                    participant_id: string
                    payout_amount_paise?: number | null
                    proof_urls?: string[] | null
                    quality_score?: number | null
                    rejection_category?: string | null
                    rejection_reason?: string | null
                    responses?: Json | null
                    reviewed_at?: string | null
                    started_at?: string | null
                    status?: Database["public"]["Enums"]["task_status"] | null
                    submitted_at?: string | null
                    time_spent_seconds?: number | null
                    updated_at?: string | null
                }
                Update: {
                    campaign_id?: string
                    created_at?: string | null
                    id?: string
                    is_spot_checked?: boolean | null
                    participant_id?: string
                    payout_amount_paise?: number | null
                    proof_urls?: string[] | null
                    quality_score?: number | null
                    rejection_category?: string | null
                    rejection_reason?: string | null
                    responses?: Json | null
                    reviewed_at?: string | null
                    started_at?: string | null
                    status?: Database["public"]["Enums"]["task_status"] | null
                    submitted_at?: string | null
                    time_spent_seconds?: number | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "tasks_campaign_id_fkey"
                        columns: ["campaign_id"]
                        isOneToOne: false
                        referencedRelation: "campaigns"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "tasks_participant_id_fkey"
                        columns: ["participant_id"]
                        isOneToOne: false
                        referencedRelation: "community_profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            calculate_campaign_match_score: {
                Args: { p_campaign_id: string; p_creator_id: string }
                Returns: number
            }
            get_community_discover_campaigns: {
                Args: { p_participant_id: string }
                Returns: {
                    accepted_submissions: number | null
                    brand_brief: Json | null
                    brand_id: string
                    budget_paise: number
                    campaign_type: Database["public"]["Enums"]["campaign_type"]
                    completed_at: string | null
                    created_at: string | null
                    creator_fee_paise: number | null
                    creator_fee_rate: number | null
                    creator_id: string | null
                    current_participants: number | null
                    description: string
                    ends_at: string | null
                    escrow_funded_at: string | null
                    stripe_payment_intent_id: string | null
                    id: string
                    per_task_paise: number
                    platform_fee_paise: number | null
                    proof_required: boolean | null
                    proof_type: string | null
                    required_geo: string[] | null
                    starts_at: string | null
                    status: Database["public"]["Enums"]["campaign_status"] | null
                    tags: string[] | null
                    target_participants: number
                    task_duration_minutes: number
                    task_instructions: string
                    task_min_seconds: number
                    title: string
                    updated_at: string | null
                }[]
                SetofOptions: {
                    from: "*"
                    to: "campaigns"
                    isOneToOne: false
                    isSetofReturn: true
                }
            }
            get_creator_dashboard_stats: {
                Args: { p_creator_id: string }
                Returns: {
                    active_campaigns: number
                    avg_activation_rate: number
                    community_earned_total: number
                    this_month_earned: number
                    total_earned: number
                }[]
            }
            get_my_role: {
                Args: never
                Returns: Database["public"]["Enums"]["user_role"]
            }
        }
        Enums: {
            campaign_status:
            | "draft"
            | "pending_review"
            | "active"
            | "paused"
            | "completed"
            | "cancelled"
            campaign_type:
            | "research"
            | "review"
            | "referral"
            | "content"
            | "beta_test"
            | "vote"
            creator_tier: "emerging" | "established" | "premier"
            payout_status: "pending" | "processing" | "paid" | "failed"
            task_status:
            | "in_progress"
            | "submitted"
            | "approved"
            | "rejected"
            | "paid"
            user_role: "creator" | "community" | "brand" | "admin"
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
    public: {
        Enums: {
            campaign_status: [
                "draft",
                "pending_review",
                "active",
                "paused",
                "completed",
                "cancelled",
            ],
            campaign_type: [
                "research",
                "review",
                "referral",
                "content",
                "beta_test",
                "vote",
            ],
            creator_tier: ["emerging", "established", "premier"],
            payout_status: ["pending", "processing", "paid", "failed"],
            task_status: ["in_progress", "submitted", "approved", "rejected", "paid"],
            user_role: ["creator", "community", "brand", "admin"],
        },
    },
} as const
