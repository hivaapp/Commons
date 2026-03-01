/**
 * Input sanitization utilities.
 * Strips HTML, enforces length limits, and trims whitespace.
 */

const MAX_LENGTHS: Record<string, number> = {
    title: 200,
    description: 5000,
    name: 150,
    handle: 50,
    bio: 1000,
    message: 2000,
    default: 1000,
};

/** Strip all HTML tags from a string */
function stripHtml(input: string): string {
    // Use a temporary element to decode entities and strip tags
    if (typeof document !== 'undefined') {
        const tmp = document.createElement('div');
        tmp.innerHTML = input;
        return tmp.textContent || tmp.innerText || '';
    }
    // Fallback: regex strip (server or SSR context)
    return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize user text input before storing.
 * - Strips HTML tags
 * - Trims whitespace
 * - Enforces max length
 */
export function sanitizeText(
    input: string,
    field: string = 'default'
): string {
    const stripped = stripHtml(input).trim();
    const maxLen = MAX_LENGTHS[field] ?? MAX_LENGTHS.default;
    return stripped.slice(0, maxLen);
}

/**
 * Sanitize a plain-text object by applying sanitizeText to every string value.
 */
export function sanitizeFormData<T extends Record<string, unknown>>(data: T): T {
    const result = { ...data };
    for (const key of Object.keys(result)) {
        if (typeof result[key] === 'string') {
            (result as Record<string, unknown>)[key] = sanitizeText(
                result[key] as string,
                key
            );
        }
    }
    return result;
}
