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

        // Admin client for elevated access
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
            .select("id, stripe_payment_intent_id, brand_id, title")
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

        if (!campaign.stripe_payment_intent_id) {
            return new Response(
                JSON.stringify({ error: "No payment intent found for this campaign" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
            );
        }

        // Capture the payment
        const captured = await stripe.paymentIntents.capture(
            campaign.stripe_payment_intent_id,
        );

        if (captured.status !== "succeeded") {
            return new Response(
                JSON.stringify({
                    error: `Capture failed: status is ${captured.status}`,
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
            );
        }

        // Update campaign to active
        await adminClient
            .from("campaigns")
            .update({
                status: "active",
                starts_at: new Date().toISOString(),
            })
            .eq("id", campaignId);

        // Notify brand
        await adminClient.from("notifications").insert({
            user_id: campaign.brand_id,
            type: "campaign_active",
            title: "Campaign is live!",
            body: `Your campaign "${campaign.title}" has been approved and is now active.`,
            data: { campaignId },
        });

        return new Response(
            JSON.stringify({ success: true, capturedAmount: captured.amount }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    } catch (err) {
        console.error("capture-payment error:", err);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    }
});
