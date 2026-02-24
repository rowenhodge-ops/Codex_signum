export declare class Debounce {
    private windowMs;
    private persistenceCount;
    private state;
    constructor(windowMs?: number, persistenceCount?: number);
    /**
     * Returns true if this event should PASS through (not debounced).
     * Returns false if this event is a duplicate / hasn't persisted long enough.
     */
    process(agentId: string, dimension: string, value: number, timestamp: number): boolean;
    reset(agentId: string, dimension: string): void;
}
//# sourceMappingURL=Debounce.d.ts.map