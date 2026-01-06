export class PerformanceMonitor {
    constructor() {
        this.frames = 0;
        this.prevTime = performance.now();
        this.fps = 60;
        this.frameTime = 0;
        this.showStats = true;

        // Create stats display
        if (this.showStats) {
            this.createStatsDisplay();
        }
    }

    createStatsDisplay() {
        this.statsElement = document.createElement('div');
        this.statsElement.id = 'stats';
        this.statsElement.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: #0f0;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      border-radius: 4px;
      z-index: 1000;
      backdrop-filter: blur(10px);
    `;
        document.body.appendChild(this.statsElement);
    }

    begin() {
        this.beginTime = performance.now();
    }

    end() {
        this.frames++;
        const time = performance.now();
        this.frameTime = time - this.beginTime;

        if (time >= this.prevTime + 1000) {
            this.fps = Math.round((this.frames * 1000) / (time - this.prevTime));
            this.frames = 0;
            this.prevTime = time;

            if (this.showStats && this.statsElement) {
                const color = this.fps >= 72 ? '#0f0' : this.fps >= 60 ? '#ff0' : '#f00';
                this.statsElement.innerHTML = `
          <div style="color: ${color}">FPS: ${this.fps}</div>
          <div>Frame: ${this.frameTime.toFixed(2)}ms</div>
        `;

                // Warn if performance is poor
                if (this.fps < 60) {
                    console.warn(`Low FPS detected: ${this.fps}`);
                }
            }
        }
    }

    getFPS() {
        return this.fps;
    }

    getFrameTime() {
        return this.frameTime;
    }
}
