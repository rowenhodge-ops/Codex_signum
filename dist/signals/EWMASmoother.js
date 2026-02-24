export class EWMASmoother {
    alphaLeaf;
    alphaDefault;
    alphaHub;
    state = new Map();
    constructor(alphaLeaf = 0.25, alphaDefault = 0.15, alphaHub = 0.08) {
        this.alphaLeaf = alphaLeaf;
        this.alphaDefault = alphaDefault;
        this.alphaHub = alphaHub;
    }
    process(key, rawValue, topologyRole = "default") {
        const alpha = this.getAlpha(topologyRole);
        const prev = this.state.get(key) ?? rawValue; // Initialize to first value
        const smoothed = alpha * rawValue + (1 - alpha) * prev;
        this.state.set(key, smoothed);
        return smoothed;
    }
    getAlpha(role) {
        switch (role) {
            case "leaf":
                return this.alphaLeaf;
            case "hub":
                return this.alphaHub;
            default:
                return this.alphaDefault;
        }
    }
    getCurrentValue(key) {
        return this.state.get(key);
    }
}
//# sourceMappingURL=EWMASmoother.js.map