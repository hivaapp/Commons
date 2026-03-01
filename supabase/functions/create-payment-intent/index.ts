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

        // Authenticated client
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } },
        );

        // Admin client
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

        // 1. Verify caller is campaign's brand_id
        const { data: campaign, error: campErr } = await adminClient
            .from("campaigns")
            .select(
                "id, brand_id, creator_id, status, budget_paise, title, stripe_payment_intent_id",
            )
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

        if (campaign.brand_id !== user.id) {
            return new Response(
                JSON.stringify({ error: "Not your campaign" }),
                {
                    status: 403,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
            );
        }

        // 2. Campaign must be in draft status with creator_id set
        if (campaign.status !== "draft") {
            return new Response(
                JSON.stringify({
                    error: "Campaign must be in draft status to create payment",
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
            );
        }

        if (!campaign.creator_id) {
            return new Response(
                JSON.stringify({ error: "Campaign must have a creator assigned" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
            );
        }

        // If payment intent already exists, return the existing one
        if (campaign.stripe_payment_intent_id) {
            try {
                const existingPI = await stripe.paymentIntents.retrieve(
                    campaign.stripe_payment_intent_id,
                );
                if (
                    existingPI.status === "requires_payment_method" ||
                    existingPI.status === "requires_confirmation" ||
                    existingPI.status === "requires_action"
                ) {
                    return new Response(
                        JSON.stringify({
                            clientSecret: existingPI.client_secret,
                            paymentIntentId: existingPI.id,
                            amount: existingPI.amount,
                        }),
                        {
                            status: 200,
                            headers: {
                                ...corsHeaders,
                                "Content-Type": "application/json",
                            },
                        },
                    );
                }
            } catch {
                // PaymentIntent doesn't exist or is invalid, create a new one
            }
        }

        // 3. Create Stripe PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: campaign.budget_paise, // Stripe uses smallest unit (paise for INR)
            currency: "inr",
            metadata: {
                campaignId: campaign.id,
                brandId: campaign.brand_id,
            },
            capture_method: "manual", // authorize now, capture when campaign launches
            description: `Commons campaign: ${campaign.title}`,
        });

        // Store the payment intent ID on the campaign
        await adminClient
            .from("campaigns")
            .update({ stripe_payment_intent_id: paymentIntent.id })
            .eq("id", campaignId);

        // 4. Return client secret
        return new Response(
            JSON.stringify({
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    } catch (err) {
        console.error("create-payment-intent error:", err);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    }
});
