/**
 * TimeGateTracker — tracks *active* time the user spends on a task.
 * Pauses on tab switch / minimize. Invisible to the user.
 */
export class TimeGateTracker {
    private startTime = Date.now()
    private activeMs = 0
    private lastActiveTs = Date.now()
    private visible = true
    private handleVisibility: () => void
    private minimumSeconds: number

    constructor(minimumSeconds: number, preElapsedSeconds = 0) {
        this.minimumSeconds = minimumSeconds
        this.activeMs = preElapsedSeconds * 1000
        this.handleVisibility = () => {
            if (document.hidden) {
                this.activeMs += Date.now() - this.lastActiveTs
                this.visible = false
            } else {
                this.lastActiveTs = Date.now()
                this.visible = true
            }
        }
        document.addEventListener('visibilitychange', this.handleVisibility)
    }

    /** Total active seconds (tab-in-focus only). */
    getActiveSeconds(): number {
        const total = this.visible
            ? this.activeMs + (Date.now() - this.lastActiveTs)
            : this.activeMs
        return Math.round(total / 1000)
    }

    /** Has the user spent enough active time? */
    isPassed(): boolean {
        return this.getActiveSeconds() >= this.minimumSeconds
    }

    /** Metadata payload sent to the edge function. */
    getMetadata() {
        return {
            totalElapsed: Math.round((Date.now() - this.startTime) / 1000),
            activeSeconds: this.getActiveSeconds(),
            minimumRequired: this.minimumSeconds,
            passed: this.isPassed(),
        }
    }

    /** Clean up event listener (call on unmount). */
    destroy() {
        document.removeEventListener('visibilitychange', this.handleVisibility)
    }
}
