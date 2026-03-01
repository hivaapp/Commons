import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
    apiVersion: "2024-12-18.acacia",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

Deno.serve(async (req: Request) => {
    // Webhook doesn't need CORS or auth header — it comes from Stripe
    if (req.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
        return new Response("Missing stripe-signature header", { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return new Response("Invalid signature", { status: 400 });
    }

    const adminClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    try {
        switch (event.type) {
            // ── Payment Intent Succeeded ──
            case "payment_intent.succeeded": {
                const pi = event.data.object as Stripe.PaymentIntent;
                const campaignId = pi.metadata?.campaignId;

                if (campaignId) {
                    // Update campaign escrow confirmed
                    await adminClient
                        .from("campaigns")
                        .update({
                            escrow_funded_at: new Date().toISOString(),
                        })
                        .eq("stripe_payment_intent_id", pi.id);

                    // Notify brand
                    if (pi.metadata?.brandId) {
                        await adminClient.from("notifications").insert({
                            user_id: pi.metadata.brandId,
                            type: "escrow_confirmed",
                            title: "Payment confirmed",
                            body: "Your campaign payment has been confirmed.",
                            data: { campaignId },
                        });
                    }
                }
                break;
            }

            // ── Payment Intent Failed ──
            case "payment_intent.payment_failed": {
                const pi = event.data.object as Stripe.PaymentIntent;
                const campaignId = pi.metadata?.campaignId;

                if (campaignId) {
                    // Reset campaign to draft
                    await adminClient
                        .from("campaigns")
                        .update({
                            status: "draft",
                            stripe_payment_intent_id: null,
                            escrow_funded_at: null,
                        })
                        .eq("stripe_payment_intent_id", pi.id);

                    // Notify brand of failure
                    if (pi.metadata?.brandId) {
                        await adminClient.from("notifications").insert({
                            user_id: pi.metadata.brandId,
                            type: "payment_failed",
                            title: "Payment failed",
                            body: `Your campaign payment failed: ${pi.last_payment_error?.message ?? "Unknown error"}. Please try again.`,
                            data: { campaignId },
                        });
                    }
                }
                break;
            }

            // ── Transfer Created ──
            case "transfer.created": {
                const transfer = event.data.object as Stripe.Transfer;
                const participantId = transfer.metadata?.participantId;

                if (participantId) {
                    await adminClient
                        .from("payouts")
                        .update({
                            status: "processing",
                            stripe_transfer_id: transfer.id,
                        })
                        .eq("recipient_id", participantId)
                        .eq("stripe_transfer_id", null)
                        .eq("status", "pending");
                }
                break;
            }

            // ── Payout Paid (funds reached bank) ──
            case "payout.paid": {
                const payout = event.data.object as Stripe.Payout;
                // Stripe payouts don't have custom metadata in the same way.
                // We match via transfer -> payout relationship or process all
                // pending payouts that match the amount.
                // For now, log it. Full matching requires stored transfer references.
                console.log("Payout paid:", payout.id, "amount:", payout.amount);
                break;
            }

            // ── Payout Failed ──
            case "payout.failed": {
                const payout = event.data.object as Stripe.Payout;
                console.log("Payout failed:", payout.id, "reason:", payout.failure_message);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("Webhook handler error:", err);
        return new Response(
            JSON.stringify({ error: "Webhook handler failed" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
});
