import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuditPayload {
    user_id: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    metadata?: Record<string, unknown>;
}

// Simple in-memory rate limiter (per function instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60; // max calls per minute per user
const WINDOW_MS = 60_000;

function isRateLimited(userId: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(userId);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(userId, { count: 1, resetAt: now + WINDOW_MS });
        return false;
    }

    entry.count++;
    if (entry.count > RATE_LIMIT) {
        return true;
    }
    return false;
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const payload: AuditPayload = await req.json();

        if (!payload.user_id || !payload.action || !payload.resource_type) {
            return new Response(
                JSON.stringify({ error: "Missing required fields: user_id, action, resource_type" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        // Rate limiting
        if (isRateLimited(payload.user_id)) {
            return new Response(
                JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
                {
                    status: 429,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        // Extract IP from headers if available
        const ip = req.headers.get("x-forwarded-for") ??
            req.headers.get("x-real-ip") ??
            null;

        const { data, error } = await supabase
            .from("audit_log")
            .insert({
                user_id: payload.user_id,
                action: payload.action,
                resource_type: payload.resource_type,
                resource_id: payload.resource_id ?? null,
                metadata: payload.metadata ?? {},
                ip_address: ip,
            })
            .select()
            .single();

        if (error) {
            console.error("Error inserting audit log:", error);
            return new Response(
                JSON.stringify({ error: error.message }),
                {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        return new Response(
            JSON.stringify({ success: true, log: data }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (err) {
        console.error("Unexpected error:", err);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
