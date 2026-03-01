/**
 * Paise-to-rupees formatting utilities.
 * Never format money inline in components — always use these helpers.
 */

/** Compact display: ₹2.4L, ₹19.2k, ₹280 */
export const formatRupees = (paise: number): string => {
    const rupees = paise / 100;
    if (rupees >= 10_000_000) return `₹${(rupees / 10_000_000).toFixed(1)}Cr`;
    if (rupees >= 100_000) return `₹${(rupees / 100_000).toFixed(1)}L`;
    if (rupees >= 1_000) return `₹${(rupees / 1_000).toFixed(1)}k`;
    return `₹${rupees.toLocaleString('en-IN')}`;
};

/** Exact display with locale separators: ₹19,200 */
export const formatRupeesExact = (paise: number): string => {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
};

/** For values already in rupees (not paise) */
export const formatINR = (rupees: number): string => {
    return '₹' + rupees.toLocaleString('en-IN');
};

/** Human-readable date: 26 Feb 2026 */
export const formatDate = (iso: string): string => {
    return new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

/** Relative time: "2m ago", "3h ago", "5d ago" */
export const formatRelativeTime = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
};

/** Format seconds as "6m 20s" */
export const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
};
