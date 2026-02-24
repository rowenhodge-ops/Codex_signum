export class CUSUMMonitor {
    h;
    k;
    firEnabled;
    state = new Map();
    constructor(h = 5, k = 0.5, firEnabled = true) {
        this.h = h;
        this.k = k;
        this.firEnabled = firEnabled;
    }
    process(key, value) {
        let s = this.state.get(key);
        if (!s) {
            // Auto-initialize with this value as baseline
            this.initializeAgent(key, value);
            s = this.state.get(key);
        }
        s.eventCount++;
        // Upper CUSUM: detects upward shifts
        // C_H(t) = max(0, C_H(t-1) + x_t - μ₀ - k)
        s.upperCusum = Math.max(0, s.upperCusum + value - s.baseline - this.k);
        // Lower CUSUM: detects downward shifts
        // C_L(t) = max(0, C_L(t-1) - x_t + μ₀ - k)
        s.lowerCusum = Math.max(0, s.lowerCusum - value + s.baseline - this.k);
        const upperAlarm = s.upperCusum > this.h;
        const lowerAlarm = s.lowerCusum > this.h;
        const alarm = upperAlarm || lowerAlarm;
        let direction = "none";
        if (upperAlarm && lowerAlarm) {
            // Both triggered — use the larger one
            direction = s.upperCusum > s.lowerCusum ? "up" : "down";
        }
        else if (upperAlarm) {
            direction = "up";
        }
        else if (lowerAlarm) {
            direction = "down";
        }
        if (alarm && !s.inAlarm) {
            s.inAlarm = true;
        }
        else if (!alarm && s.inAlarm) {
            // Reset after alarm clears
            s.inAlarm = false;
            s.upperCusum = 0;
            s.lowerCusum = 0;
        }
        return {
            upperCusum: s.upperCusum,
            lowerCusum: s.lowerCusum,
            alarm,
            direction,
        };
    }
    initializeAgent(key, baseline) {
        const initial = this.firEnabled ? this.h / 2 : 0;
        this.state.set(key, {
            upperCusum: initial,
            lowerCusum: initial,
            baseline,
            eventCount: 0,
            inAlarm: false,
        });
    }
}
//# sourceMappingURL=CUSUMMonitor.js.map