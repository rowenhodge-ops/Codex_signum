import type { EpsilonR } from "../../types/state-dimensions.js";
import type { FeedbackRecommendation, ObservableEvent, ObserverState } from "./types.js";
/**
 * The Observer — watches, collects, and triggers feedback.
 */
export declare class Observer {
    private state;
    constructor();
    observePipelineResult(result: ObserverState["pipelineResults"][number]): void;
    observe(event: ObservableEvent): void;
    generateFeedback(): FeedbackRecommendation[];
    private updateEpsilonR;
    private checkDistillationTriggers;
    getState(): Readonly<ObserverState>;
    getObservationCount(): number;
    getDistillationCount(): number;
    getDecisionCount(): number;
    getEpsilonR(): EpsilonR;
}
//# sourceMappingURL=observer.d.ts.map