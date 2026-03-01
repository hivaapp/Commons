/**
 * Anti-gaming utilities.
 * Honeypot field, attention-check injection & validation.
 */

export interface Question {
    id: string
    type: 'scale' | 'multiple_choice' | 'text'
    text: string
    options?: string[]
    correctAnswer?: string
    isAttentionCheck?: boolean
}

// ---------- Honeypot ----------

/** Hidden field: bots fill it in, humans don't. Must always be empty. */
export const checkHoneypot = (val: string): boolean => val === ''

// ---------- Attention checks ----------

/**
 * Inject one attention-check question at a random middle position.
 * Returns a new array — original is not mutated.
 */
export function injectAttentionCheck(questions: Question[]): Question[] {
    if (questions.length < 2) return questions

    const check: Question = {
        id: `attn_${Date.now()}`,
        type: 'multiple_choice',
        text: 'For quality verification, please select "Option B" for this question.',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option B',
        isAttentionCheck: true,
    }

    // Insert somewhere between index 1 and length-1
    const pos = Math.floor(Math.random() * (questions.length - 2)) + 1
    return [...questions.slice(0, pos), check, ...questions.slice(pos)]
}

/**
 * Verify every attention-check question was answered correctly.
 */
export function checkAttentionAnswers(
    responses: Record<string, string | number>,
    questions: Question[],
): boolean {
    return questions
        .filter(q => q.isAttentionCheck)
        .every(q => String(responses[q.id]) === q.correctAnswer)
}
