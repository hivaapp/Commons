import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
    apiVersion: "2024-12-18.acacia",
});

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                {
                    status: 401,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
            );
        }

        const adminClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );

        // Verify caller is admin
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } },
        );

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                {
                    status: 401,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
            );
        }

        const { data: profile } = await adminClient
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (!profile || profile.role !== "admin") {
            return new Response(
                JSON.stringify({ error: "Admin access required" }),
                {
                    status: 403,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
            );
        }

        const { campaignId } = await req.json();
        if (!campaignId) {
            return new Response(
                JSON.stringify({ error: "Missing campaignId" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
            );
        }

        // Get campaign
        const { data: campaign, error: campErr } = await adminClient
            .from("campaigns")
            .select("id, status, per_task_paise, creator_id, creator_fee_paise")
            .eq("id", campaignId)
            .single();

        if (campErr || !campaign) {
            return new Response(
                JSON.stringify({ error: "Campaign not found" }),
                {
                    status: 404,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
            );
        }

        if (campaign.status !== "completed") {
            return new Response(
                JSON.stringify({ error: "Campaign must be completed to process payouts" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
            );
        }

        // 1. Fetch all approved tasks
        const { data: tasks, error: tasksErr } = await adminClient
            .from("tasks")
            .select("id, participant_id, payout_amount_paise")
            .eq("campaign_id", campaignId)
            .eq("status", "approved");

        if (tasksErr) {
            return new Response(
                JSON.stringify({ error: "Failed to fetch tasks" }),
                {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
            );
        }

        const results: Array<{
            participantId: string;
            status: string;
            amount: number;
            transferId?: string;
        }> = [];

        // 2. Process each participant payout
        for (const task of tasks ?? []) {
            // Get participant bank/UPI details
            const { data: participant } = await adminClient
                .from("community_profiles")
                .select("id, upi_id, bank_account, consecutive_accepted")
                .eq("id", task.participant_id)
                .single();

            if (!participant) continue;

            // Calculate amount: per_task_paise + 10% streak bonus if applicable
            let amount = task.payout_amount_paise ?? campaign.per_task_paise;
            const streakBonus =
                (participant.consecutive_accepted ?? 0) >= 5
                    ? Math.round(amount * 0.1)
                    : 0;
            amount += streakBonus;

            const hasPaymentDetails =
                participant.upi_id || participant.bank_account;

            if (!hasPaymentDetails) {
                // Store as manual_pending if no payment details
                const { data: payout } = await adminClient
                    .from("payouts")
                    .insert({
                        recipient_id: participant.id,
                        recipient_role: "community",
                        campaign_id: campaignId,
                        amount_paise: amount,
                        status: "pending",
                        upi_id: participant.upi_id,
                        initiated_at: new Date().toISOString(),
                    })
                    .select("id")
                    .single();

                results.push({
                    participantId: participant.id,
                    status: "manual_pending",
                    amount,
                });

                // Notify participant to add bank details
                await adminClient.from("notifications").insert({
                    user_id: participant.id,
                    type: "payout_pending_bank",
                    title: "Payout waiting for bank details",
                    body: "Please add your bank/UPI details to receive your payout.",
                    data: { campaignId, payoutId: payout?.id },
                });

                continue;
            }

            // NOTE: Stripe Connect in India has restrictions.
            // For now, we store payouts as 'processing' and handle via
            // Stripe Payouts API to bank accounts directly from Commons' balance.
            // If Stripe Connect is available, use stripe.transfers.create instead.

            try {
                // Attempt payout via Stripe — currently stored as manual_pending
                // since Stripe Connect India availability varies.
                // When available, use:
                // const transfer = await stripe.transfers.create({
                //     amount: amount,
                //     currency: 'inr',
                //     destination: participant.stripe_account_id,
                //     transfer_group: campaignId,
                //     metadata: { participantId: participant.id, taskId: task.id },
                // });

                const { data: payout } = await adminClient
                    .from("payouts")
                    .insert({
                        recipient_id: participant.id,
                        recipient_role: "community",
                        campaign_id: campaignId,
                        amount_paise: amount,
                        status: "pending",
                        stripe_transfer_id: null, // Will be set when transfer executes
                        upi_id: participant.upi_id,
                        initiated_at: new Date().toISOString(),
                    })
                    .select("id")
                    .single();

                results.push({
                    participantId: participant.id,
                    status: "pending",
                    amount,
                });

                // Notify participant
                await adminClient.from("notifications").insert({
                    user_id: participant.id,
                    type: "payout_initiated",
                    title: "Payout initiated",
                    body: `₹${(amount / 100).toLocaleString("en-IN")} is being processed for your task.`,
                    data: { campaignId, payoutId: payout?.id },
                });
            } catch (transferErr) {
                console.error("Transfer error for participant:", participant.id, transferErr);

                await adminClient.from("payouts").insert({
                    recipient_id: participant.id,
                    recipient_role: "community",
                    campaign_id: campaignId,
                    amount_paise: amount,
                    status: "failed",
                    failure_reason: "Stripe transfer failed",
                    upi_id: participant.upi_id,
                    initiated_at: new Date().toISOString(),
                    failed_at: new Date().toISOString(),
                });

                results.push({
                    participantId: participant.id,
                    status: "failed",
                    amount,
                });
            }
        }

        // 3. Creator payout
        if (campaign.creator_id && campaign.creator_fee_paise) {
            const { data: creatorProfile } = await adminClient
                .from("creator_profiles")
                .select("id")
                .eq("id", campaign.creator_id)
                .single();

            if (creatorProfile) {
                await adminClient.from("payouts").insert({
                    recipient_id: campaign.creator_id,
                    recipient_role: "creator",
                    campaign_id: campaignId,
                    amount_paise: campaign.creator_fee_paise,
                    status: "pending",
                    initiated_at: new Date().toISOString(),
                });

                results.push({
                    participantId: campaign.creator_id,
                    status: "pending",
                    amount: campaign.creator_fee_paise,
                });

                await adminClient.from("notifications").insert({
                    user_id: campaign.creator_id,
                    type: "payout_initiated",
                    title: "Creator payout initiated",
                    body: `₹${(campaign.creator_fee_paise / 100).toLocaleString("en-IN")} creator fee is being processed.`,
                    data: { campaignId },
                });
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                totalPayouts: results.length,
                results,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    } catch (err) {
        console.error("process-payouts error:", err);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    }
});
