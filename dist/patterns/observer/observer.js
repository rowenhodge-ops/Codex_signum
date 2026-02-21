import { computeEpsilonR } from "../../computation/index.js";
import { createObservation, distillObservations, shouldDistill, } from "../../memory/index.js";
import { checkCorrectionScale, checkEvolutionaryScale, checkLearningScale, } from "./feedback.js";
/**
 * The Observer — watches, collects, and triggers feedback.
 */
export class Observer {
    state;
    constructor() {
        this.state = {
            observations: [],
            distillations: [],
            decisionsThisSession: [],
            pipelineResults: [],
            epsilonR: computeEpsilonR(0, 0),
            sessionStartedAt: new Date(),
        };
    }
    observePipelineResult(result) {
        this.state.pipelineResults.push(result);
        for (const stage of result.stages) {
            const obs = createObservation(`devagent:${stage.stage}`, "execution_outcome", {
                success: stage.qualityScore >= 0.5,
                qualityScore: stage.qualityScore,
                durationMs: stage.durationMs,
                modelUsed: stage.modelId,
                context: { correction: stage.correctionIteration },
            });
            this.state.observations.push(obs);
        }
        const latencyObs = createObservation("devagent:pipeline", "execution_outcome", {
            success: result.overallQuality >= 0.5,
            durationMs: result.totalDurationMs,
        });
        this.state.observations.push(latencyObs);
        if (result.correctionCount > 0) {
            const corrObs = createObservation("devagent:pipeline", "correction_loop", {
                success: result.overallQuality >= 0.5,
                context: { corrections: result.correctionCount },
            });
            this.state.observations.push(corrObs);
        }
        this.state.decisionsThisSession.push(...result.decisions);
        this.updateEpsilonR();
        this.checkDistillationTriggers();
    }
    observe(event) {
        const obs = createObservation(`event:${event.type}`, "feedback_event", {
            success: true,
            context: { eventData: JSON.stringify(event.data).slice(0, 500) },
        });
        this.state.observations.push(obs);
    }
    generateFeedback() {
        const recommendations = [];
        recommendations.push(...checkCorrectionScale(this.state));
        recommendations.push(...checkLearningScale(this.state));
        recommendations.push(...checkEvolutionaryScale(this.state));
        return recommendations;
    }
    updateEpsilonR() {
        const exploratory = this.state.decisionsThisSession.filter((d) => d.outcome?.wasExploratory === true).length;
        this.state.epsilonR = computeEpsilonR(exploratory, this.state.decisionsThisSession.length);
    }
    checkDistillationTriggers() {
        const byType = new Map();
        for (const obs of this.state.observations) {
            const key = obs.observationType;
            if (!byType.has(key))
                byType.set(key, []);
            byType.get(key).push(obs);
        }
        for (const [, observations] of byType) {
            if (shouldDistill(observations, 10)) {
                const distillation = distillObservations(observations, "performance_profile");
                this.state.distillations.push(distillation);
            }
        }
    }
    getState() {
        return this.state;
    }
    getObservationCount() {
        return this.state.observations.length;
    }
    getDistillationCount() {
        return this.state.distillations.length;
    }
    getDecisionCount() {
        return this.state.decisionsThisSession.length;
    }
    getEpsilonR() {
        return this.state.epsilonR;
    }
}
//# sourceMappingURL=observer.js.map