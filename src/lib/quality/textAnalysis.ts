/**
 * Client-side text quality analysis.
 * Catches gibberish, generic filler, and low-effort text
 * before the server even sees it.
 */

export interface TextQuality {
    score: number     // 0.0 → 1.0
    flags: string[]
    rejected: boolean
    reason?: string
}

export function analyzeText(text: string): TextQuality {
    const flags: string[] = []
    const t = text.trim()

    // ---- Hard reject: too short ----
    if (t.length < 20) {
        return { score: 0, flags: ['too_short'], rejected: true, reason: 'too_short' }
    }

    // ---- Gibberish patterns ----
    const gibberish = [
        /^[a-z]{1,3}(\s[a-z]{1,3}){3,}$/i,   // "aa bb cc dd"
        /(.)\1{4,}/,                            // "aaaaa"
        /^(yes|no|ok|good|nice|great|fine|okay)[\s.!]*$/i,
    ]
    if (gibberish.some(p => p.test(t))) {
        return { score: 0, flags: ['gibberish'], rejected: true, reason: 'gibberish' }
    }

    // ---- Generic filler phrases ----
    const fillers = [
        'great product',
        'nice experience',
        'good app',
        'love it',
        'highly recommend',
        'very nice',
        'best app',
    ]
    const fillerHits = fillers.filter(f => t.toLowerCase().includes(f)).length
    if (fillerHits >= 2) flags.push('generic')

    // ---- Specificity: concrete nouns and action words ----
    const specificPatterns = [
        /step \d+/i,
        /button/i,
        /screen/i,
        /error/i,
        /crash/i,
        /slow/i,
        /fast/i,
        /when i/i,
        /after i/i,
        /could not/i,
    ]
    const specificityScore = Math.min(
        specificPatterns.filter(p => p.test(t)).length / 4,
        1.0,
    )

    // ---- Composite score ----
    let score = specificityScore * 0.7 + (fillerHits === 0 ? 0.3 : 0.1)
    if (flags.includes('generic')) score = Math.min(score, 0.4)

    score = Math.max(0, Math.min(1, score))
    const rejected = score < 0.2

    return {
        score,
        flags,
        rejected,
        reason: rejected ? flags[0] || 'low_quality' : undefined,
    }
}

/**
 * Detects sentiment / rating mismatch.
 * e.g. 5-star rating but text is full of negative words.
 */
export function checkSentimentConsistency(rating: number, text: string): boolean {
    const lower = text.toLowerCase()
    const pos = ['good', 'great', 'excellent', 'love', 'easy', 'perfect']
        .filter(w => lower.includes(w)).length
    const neg = ['bad', 'terrible', 'slow', 'crash', 'error', 'confus', 'frustrat']
        .filter(w => lower.includes(w)).length

    if (rating >= 4 && neg > pos + 1) return false
    if (rating <= 2 && pos > neg + 1) return false
    return true
}
