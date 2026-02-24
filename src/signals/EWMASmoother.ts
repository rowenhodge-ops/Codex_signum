export class EWMASmoother {
  private state: Map<string, number> = new Map();

  constructor(
    private alphaLeaf: number = 0.25,
    private alphaDefault: number = 0.15,
    private alphaHub: number = 0.08,
  ) {}

  process(
    key: string,
    rawValue: number,
    topologyRole: "leaf" | "hub" | "default" = "default",
  ): number {
    const alpha = this.getAlpha(topologyRole);
    const prev = this.state.get(key) ?? rawValue; // Initialize to first value
    const smoothed = alpha * rawValue + (1 - alpha) * prev;
    this.state.set(key, smoothed);
    return smoothed;
  }

  private getAlpha(role: "leaf" | "hub" | "default"): number {
    switch (role) {
      case "leaf":
        return this.alphaLeaf;
      case "hub":
        return this.alphaHub;
      default:
        return this.alphaDefault;
    }
  }

  getCurrentValue(key: string): number | undefined {
    return this.state.get(key);
  }
}
