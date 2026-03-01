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

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } },
        );

        const adminClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
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

        const { paymentIntentId, campaignId } = await req.json();
        if (!paymentIntentId || !campaignId) {
            return new Response(
                JSON.stringify({ error: "Missing paymentIntentId or campaignId" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
            );
        }

        // Verify payment intent status
        const paymentIntent = await stripe.paymentIntents.retrieve(
            paymentIntentId,
        );

        if (paymentIntent.status !== "requires_capture") {
            return new Response(
                JSON.stringify({
                    error: `PaymentIntent status is ${paymentIntent.status}, expected requires_capture`,
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
            );
        }

        // Update campaign
        const { error: updateErr } = await adminClient
            .from("campaigns")
            .update({
                stripe_payment_intent_id: paymentIntentId,
                escrow_funded_at: new Date().toISOString(),
                status: "pending_review",
            })
            .eq("id", campaignId)
            .eq("brand_id", user.id);

        if (updateErr) {
            console.error("Update campaign error:", updateErr);
            return new Response(
                JSON.stringify({ error: "Failed to update campaign" }),
                {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
            );
        }

        // Insert notification for brand
        await adminClient.from("notifications").insert({
            user_id: user.id,
            type: "campaign_funded",
            title: "Campaign funded",
            body: "Your campaign payment has been authorized. Our team will review it shortly.",
            data: { campaignId },
        });

        // Insert notification for internal review (admin users)
        const { data: admins } = await adminClient
            .from("profiles")
            .select("id")
            .eq("role", "admin");

        if (admins && admins.length > 0) {
            const adminNotifs = admins.map((admin) => ({
                user_id: admin.id,
                type: "campaign_review_needed",
                title: "New campaign for review",
                body: `Campaign ${campaignId} has been funded and needs review.`,
                data: { campaignId },
            }));
            await adminClient.from("notifications").insert(adminNotifs);
        }

        return new Response(
            JSON.stringify({ success: true }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    } catch (err) {
        console.error("confirm-campaign-payment error:", err);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    }
});
