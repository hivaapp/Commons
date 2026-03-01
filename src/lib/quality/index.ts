/**
 * Quality-check orchestrator.
 * Runs all client-side checks and produces a single pass/fail verdict
 * before the payload is sent to the edge function.
 */

import { checkHoneypot, checkAttentionAnswers } from './antiGaming'
import type { Question } from './antiGaming'
import { analyzeText } from './textAnalysis'
import type { TimeGateTracker } from './timeGate'

export type { Question } from './antiGaming'
export { TimeGateTracker } from './timeGate'
export { injectAttentionCheck, checkHoneypot } from './antiGaming'
export { analyzeText, checkSentimentConsistency } from './textAnalysis'

export interface QualityResult {
    passed: boolean
    score: number
    flags: string[]
    reason?: string
}

export async function runQualityChecks(params: {
    responses: Record<string, string | number>
    timeGate: ReturnType<TimeGateTracker['getMetadata']>
    questions: Question[]
    honeypot: string
}): Promise<QualityResult> {
    const flags: string[] = []

    // 1. Bot check (honeypot)
    if (!checkHoneypot(params.honeypot)) {
        return { passed: false, score: 0, flags: ['bot'], reason: 'bot_detected' }
    }

    // 2. Time gate
    if (!params.timeGate.passed) {
        flags.push('too_fast')
    }

    // 3. Attention checks
    if (!checkAttentionAnswers(params.responses, params.questions)) {
        flags.push('attention_failed')
    }

    // 4. Text quality for open-ended answers
    let textScore = 1.0
    for (const [qId, val] of Object.entries(params.responses)) {
        const q = params.questions.find(qq => qq.id === qId)
        if (q?.type === 'text' && typeof val === 'string') {
            const result = analyzeText(val)
            textScore = Math.min(textScore, result.score)
            flags.push(...result.flags)
        }
    }

    // 5. Weighted composite score
    const score =
        (params.timeGate.passed ? 1 : 0.2) * 0.25 +
        textScore * 0.50 +
        (flags.includes('attention_failed') ? 0 : 1) * 0.25

    // 6. Auto-reject thresholds
    const autoReject =
        flags.includes('bot') ||
        flags.includes('gibberish') ||
        flags.includes('attention_failed') ||
        score < 0.25

    return {
        passed: !autoReject,
        score,
        flags: [...new Set(flags)],
        reason: autoReject ? flags[0] : undefined,
    }
}
