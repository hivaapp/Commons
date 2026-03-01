import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    // CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ accepted: false, message: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        // Authenticated Supabase client (inherits the caller's JWT)
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } },
        );

        // Admin client for operations that need elevated access
        const adminClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return new Response(
                JSON.stringify({ accepted: false, message: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        const body = await req.json();
        const { task_id, campaign_id, responses, client_quality, time_metadata } = body;

        if (!task_id || !campaign_id) {
            return new Response(
                JSON.stringify({ accepted: false, message: "Missing task_id or campaign_id" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        // -------------------------------------------------------
        // 1. Verify caller owns this task
        // -------------------------------------------------------
        const { data: task, error: taskErr } = await adminClient
            .from("tasks")
            .select("id, participant_id, campaign_id, started_at, status")
            .eq("id", task_id)
            .single();

        if (taskErr || !task) {
            return new Response(
                JSON.stringify({ accepted: false, message: "Task not found" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        if (task.participant_id !== user.id) {
            return new Response(
                JSON.stringify({ accepted: false, message: "Not your task" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        // -------------------------------------------------------
        // 2. Server-side time check
        // -------------------------------------------------------
        const { data: campaign, error: campErr } = await adminClient
            .from("campaigns")
            .select("task_min_seconds, per_task_paise, title")
            .eq("id", campaign_id)
            .single();

        if (campErr || !campaign) {
            return new Response(
                JSON.stringify({ accepted: false, message: "Campaign not found" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        let serverTimePassed = true;
        let serverElapsed = time_metadata?.activeSeconds ?? 0;
        if (task.started_at) {
            const startedAt = new Date(task.started_at).getTime();
            const now = Date.now();
            serverElapsed = Math.floor((now - startedAt) / 1000);
            serverTimePassed = serverElapsed >= (campaign.task_min_seconds ?? 60) * 0.6;
        }

        // -------------------------------------------------------
        // 3. Server-side gibberish check on text responses
        // -------------------------------------------------------
        let serverTextOk = true;
        for (const val of Object.values(responses ?? {})) {
            if (typeof val === "string") {
                if (/(.)\1{5,}/.test(val)) { serverTextOk = false; break; }
                if (val.trim().length < 10) { serverTextOk = false; break; }
            }
        }

        // -------------------------------------------------------
        // 4. Duplicate check (basic string matching)
        // -------------------------------------------------------
        let isDuplicate = false;
        if (responses) {
            const textValues = Object.values(responses)
                .filter((v): v is string => typeof v === "string" && v.length > 20);

            if (textValues.length > 0) {
                const { data: otherTasks } = await adminClient
                    .from("tasks")
                    .select("responses")
                    .eq("campaign_id", campaign_id)
                    .neq("id", task_id)
                    .in("status", ["submitted", "approved", "paid"]);

                if (otherTasks && otherTasks.length > 0) {
                    for (const other of otherTasks) {
                        if (!other.responses) continue;
                        const otherResponses = typeof other.responses === "string"
                            ? JSON.parse(other.responses)
                            : other.responses;
                        const otherTextValues = Object.values(otherResponses)
                            .filter((v): v is string => typeof v === "string" && v.length > 20);

                        for (const myText of textValues) {
                            for (const theirText of otherTextValues) {
                                const myNorm = myText.toLowerCase().trim();
                                const theirNorm = theirText.toLowerCase().trim();
                                if (
                                    myNorm === theirNorm ||
                                    (myNorm.length > 30 && theirNorm.includes(myNorm)) ||
                                    (theirNorm.length > 30 && myNorm.includes(theirNorm))
                                ) {
                                    isDuplicate = true;
                                    break;
                                }
                            }
                            if (isDuplicate) break;
                        }
                        if (isDuplicate) break;
                    }
                }
            }
        }

        // -------------------------------------------------------
        // 5. Determine final verdict
        // -------------------------------------------------------
        const clientPassed = client_quality?.passed ?? true;
        const clientScore = client_quality?.score ?? 1.0;
        const clientFlags = client_quality?.flags ?? [];

        const passed = clientPassed && serverTimePassed && serverTextOk && !isDuplicate;

        const qualityScore = Math.round(
            (clientScore * 0.5 +
                (serverTimePassed ? 1 : 0) * 0.2 +
                (serverTextOk ? 1 : 0) * 0.15 +
                (!isDuplicate ? 1 : 0) * 0.15) * 100,
        );

        let rejectionCategory: string | null = null;
        if (!passed) {
            if (isDuplicate) rejectionCategory = "duplicate_response";
            else if (!serverTimePassed) rejectionCategory = "too_fast";
            else if (!serverTextOk) rejectionCategory = "gibberish";
            else rejectionCategory = clientFlags[0] ?? "low_quality";
        }

        const rejectionMessages: Record<string, string> = {
            too_fast: "Please take more time to thoughtfully answer each question.",
            gibberish: "Your responses need more specific detail about your experience.",
            attention_failed: "Please read each question carefully before answering.",
            bot: "Automated submission detected.",
            duplicate_response: "Your response appears to match another submission.",
            low_quality: "Your response did not meet quality requirements.",
        };

        // -------------------------------------------------------
        // 6. UPDATE task
        // -------------------------------------------------------
        const newStatus = passed ? "submitted" : "rejected";
        const isSpotChecked = passed ? Math.random() < 0.10 : false;

        await adminClient
            .from("tasks")
            .update({
                status: newStatus,
                quality_score: qualityScore,
                rejection_category: rejectionCategory,
                rejection_reason: rejectionCategory ? rejectionMessages[rejectionCategory] : null,
                responses: responses,
                submitted_at: new Date().toISOString(),
                time_spent_seconds: serverElapsed,
                payout_amount_paise: passed ? (campaign.per_task_paise ?? 0) : 0,
                is_spot_checked: isSpotChecked,
            })
            .eq("id", task_id);

        // -------------------------------------------------------
        // 7. Update community quality score
        // -------------------------------------------------------
        let communityQualityScore: number | null = null;
        if (!passed) {
            const { data: profile } = await adminClient
                .from("community_profiles")
                .select("quality_score")
                .eq("id", user.id)
                .single();

            const currentScore = profile?.quality_score ?? 50;
            const newScore = Math.max(0, currentScore - 5);
            communityQualityScore = newScore;

            await adminClient
                .from("community_profiles")
                .update({ quality_score: newScore })
                .eq("id", user.id);
        } else {
            const { data: profile } = await adminClient
                .from("community_profiles")
                .select("quality_score, total_tasks_completed")
                .eq("id", user.id)
                .single();

            communityQualityScore = Math.min(100, (profile?.quality_score ?? 50) + 2);

            await adminClient
                .from("community_profiles")
                .update({
                    quality_score: communityQualityScore,
                    total_tasks_completed: (profile?.total_tasks_completed ?? 0) + 1,
                })
                .eq("id", user.id);
        }

        // -------------------------------------------------------
        // 8. Send notification
        // -------------------------------------------------------
        try {
            await adminClient.from("notifications").insert({
                user_id: user.id,
                type: passed ? "task_approved" : "task_rejected",
                title: passed ? "Submission received" : "Submission not accepted",
                body: passed
                    ? `Your response for "${campaign.title}" is under review. Payout within 24hrs of campaign close.`
                    : rejectionMessages[rejectionCategory ?? ""] ?? "Your submission did not meet quality requirements.",
                data: { task_id, campaign_id },
            });
        } catch (_) { /* non-fatal */ }

        // -------------------------------------------------------
        // 9. Return result
        // -------------------------------------------------------
        return new Response(
            JSON.stringify({
                accepted: passed,
                reason: rejectionCategory,
                message: rejectionCategory
                    ? rejectionMessages[rejectionCategory]
                    : "Submitted successfully",
                qualityScore: communityQualityScore,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    } catch (err) {
        console.error("validate-submission error:", err);
        return new Response(
            JSON.stringify({ accepted: false, message: "Internal server error" }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    }
});
