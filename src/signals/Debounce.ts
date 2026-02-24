const SIMILARITY_THRESHOLD = 0.01;

interface DebounceState {
  /** The last accepted (baseline) value */
  acceptedValue: number;
  acceptedTimestamp: number;
  /** Tracking a candidate new value that differs from accepted */
  candidateValue: number | null;
  candidateCount: number;
}

export class Debounce {
  private state: Map<string, DebounceState> = new Map();

  constructor(
    private windowMs: number = 100,
    private persistenceCount: number = 3,
  ) {}

  /**
   * Returns true if this event should PASS through (not debounced).
   * Returns false if this event is a duplicate / hasn't persisted long enough.
   */
  process(
    agentId: string,
    dimension: string,
    value: number,
    timestamp: number,
  ): boolean {
    const key = `${agentId}:${dimension}`;
    const prev = this.state.get(key);

    if (!prev) {
      // First event — accept immediately, set as baseline
      this.state.set(key, {
        acceptedValue: value,
        acceptedTimestamp: timestamp,
        candidateValue: null,
        candidateCount: 0,
      });
      return true;
    }

    const isSimilarToAccepted =
      Math.abs(value - prev.acceptedValue) < SIMILARITY_THRESHOLD;

    if (isSimilarToAccepted) {
      const withinWindow = timestamp - prev.acceptedTimestamp < this.windowMs;
      if (withinWindow) {
        // Duplicate within window — reject
        return false;
      }
      // Same value, outside window — accept (legitimate repeat)
      prev.acceptedTimestamp = timestamp;
      prev.candidateValue = null;
      prev.candidateCount = 0;
      return true;
    }

    // Value differs from accepted baseline — require persistence
    if (
      prev.candidateValue !== null &&
      Math.abs(value - prev.candidateValue) < SIMILARITY_THRESHOLD
    ) {
      // Same candidate seen again
      prev.candidateCount++;
      if (prev.candidateCount >= this.persistenceCount) {
        // Persisted long enough — promote to accepted
        prev.acceptedValue = value;
        prev.acceptedTimestamp = timestamp;
        prev.candidateValue = null;
        prev.candidateCount = 0;
        return true;
      }
      return false;
    }

    // New candidate (different from both accepted and previous candidate)
    prev.candidateValue = value;
    prev.candidateCount = 1;
    if (this.persistenceCount <= 1) {
      // If persistence count is 1, accept immediately
      prev.acceptedValue = value;
      prev.acceptedTimestamp = timestamp;
      prev.candidateValue = null;
      prev.candidateCount = 0;
      return true;
    }
    return false;
  }

  reset(agentId: string, dimension: string): void {
    const key = `${agentId}:${dimension}`;
    this.state.delete(key);
  }
}
