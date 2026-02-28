// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
export function computeFeedbackEffectiveness(stages, correctionCount) {
    if (correctionCount === 0) {
        return { effectiveness: 1.0, correctedStages: 0, improvedStages: 0 };
    }
    const lowQualityStages = stages.filter((s) => s.qualityScore < 0.5);
    const correctedStages = Math.min(correctionCount, stages.length);
    const improvedStages = correctedStages > 0
        ? Math.max(0, correctedStages - lowQualityStages.length)
        : 0;
    const effectiveness = correctedStages > 0 ? improvedStages / correctedStages : 1.0;
    return { effectiveness, correctedStages, improvedStages };
}
//# sourceMappingURL=feedback-effectiveness.js.map