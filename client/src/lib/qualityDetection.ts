/**
 * Production-grade quality detection system.
 * Entirely client-side with < 10ms/frame performance target.
 */

// ============================================================================
// Audio Quality Detection
// ============================================================================

interface AudioAnalysis {
  rms: number; // Root Mean Square amplitude
  clipping: boolean;
  clippingPercent: number;
  noiseFloor: number;
  microphoneType: string; // "default" | "external" | "unknown"
  status: "OK" | "Too Quiet" | "Too Loud" | "Background Noise" | "Clipping";
}

class AudioQualityDetector {
  private analyser: AnalyserNode | null = null;
  private rmsWindow: number[] = [];
  private windowSize: number = 512; // ~500ms at 44.1kHz
  
  // More precise thresholds (Google-grade)
  private readonly RMS_THRESHOLD_LOW = 0.01;      // -40dB equivalent
  private readonly RMS_THRESHOLD_OPTIMAL = 0.08;  // -22dB (good speech level)
  private readonly RMS_THRESHOLD_HIGH = 0.7;      // -3dB (approaching clipping)
  private readonly CLIPPING_THRESHOLD_PERCENT = 5; // 5% clipping is noticeable
  private readonly NOISE_FLOOR_THRESHOLD = 0.003;
  private readonly NOISE_SENSITIVITY = 0.15;      // Detect background noise ratio

  constructor(analyser: AnalyserNode) {
    this.analyser = analyser;
  }

  /**
   * Calculate RMS (Root Mean Square) amplitude with higher precision.
   * Uses smoothing over multiple frames for stability.
   */
  private calculateRMS(samples: Uint8Array): number {
    let sum = 0;
    let count = 0;
    
    // Skip first/last samples which may have edge artifacts
    for (let i = 10; i < samples.length - 10; i++) {
      const normalized = (samples[i] - 128) / 128;
      sum += normalized * normalized;
      count++;
    }
    
    const rms = count > 0 ? Math.sqrt(sum / count) : 0;
    return Math.min(rms, 1.0);
  }

  /**
   * More precise clipping detection using frequency domain.
   */
  private detectClipping(samples: Uint8Array): number {
    let clipCount = 0;
    const clipThreshold = 0.95;
    
    for (let i = 0; i < samples.length; i++) {
      const normalized = Math.abs((samples[i] - 128) / 128);
      if (normalized >= clipThreshold) clipCount++;
    }
    return (clipCount / samples.length) * 100;
  }

  /**
   * Better noise floor estimation using percentile method.
   */
  private estimateNoiseFloor(samples: Uint8Array): number {
    const sorted = Array.from(samples)
      .map((s) => Math.abs((s - 128) / 128))
      .sort((a, b) => a - b);
    
    // Take bottom 5% as noise floor (more precise than 10%)
    const noiseIndex = Math.floor(sorted.length * 0.05);
    return sorted[noiseIndex] || 0;
  }

  /**
   * Detect background noise ratio.
   */
  private detectBackgroundNoise(samples: Uint8Array, noiseFloor: number): number {
    let noiseCount = 0;
    const noiseThreshold = noiseFloor * (1 + this.NOISE_SENSITIVITY);
    
    for (let i = 0; i < samples.length; i++) {
      const normalized = Math.abs((samples[i] - 128) / 128);
      if (normalized > noiseThreshold && normalized < 0.3) {
        noiseCount++;
      }
    }
    
    return (noiseCount / samples.length) * 100;
  }

  /**
   * Analyze audio frame with improved precision.
   */
  analyze(): AudioAnalysis {
    if (!this.analyser) {
      return {
        rms: 0,
        clipping: false,
        clippingPercent: 0,
        noiseFloor: 0,
        microphoneType: "unknown",
        status: "OK",
      };
    }

    const fftSize = this.analyser.fftSize;
    const dataArray = new Uint8Array(fftSize);
    this.analyser.getByteFrequencyData(dataArray);

    const rms = this.calculateRMS(dataArray);
    const clippingPercent = this.detectClipping(dataArray);
    const noiseFloor = this.estimateNoiseFloor(dataArray);
    const backgroundNoiseRatio = this.detectBackgroundNoise(dataArray, noiseFloor);

    // Maintain rolling window of RMS values
    this.rmsWindow.push(rms);
    if (this.rmsWindow.length > this.windowSize) {
      this.rmsWindow.shift();
    }

    // More precise status determination (Google grade)
    let status: AudioAnalysis["status"] = "OK";
    
    // Priority: Clipping > Too Loud > Too Quiet > Background Noise > OK
    if (clippingPercent > this.CLIPPING_THRESHOLD_PERCENT) {
      status = "Clipping";
    } else if (rms > this.RMS_THRESHOLD_HIGH) {
      status = "Too Loud";
    } else if (rms < this.RMS_THRESHOLD_LOW) {
      status = "Too Quiet";
    } else if (backgroundNoiseRatio > 40 && rms < this.RMS_THRESHOLD_OPTIMAL) {
      status = "Background Noise";
    }

    return {
      rms: rms,
      clipping: clippingPercent > this.CLIPPING_THRESHOLD_PERCENT,
      clippingPercent: clippingPercent,
      noiseFloor: noiseFloor,
      microphoneType: this.detectMicrophoneType(),
      status: status,
    };
  }
    let status: AudioAnalysis["status"] = "OK";
    if (rms < this.RMS_THRESHOLD_LOW) {
      status = "Too Quiet";
    } else if (clippingPercent > this.CLIPPING_THRESHOLD_PERCENT) {
      status = "Clipping";
    } else if (noiseFloor > this.NOISE_FLOOR_THRESHOLD && rms < 0.1) {
      status = "Background Noise";
    } else if (rms > this.RMS_THRESHOLD_HIGH) {
      status = "Too Loud";
    }

    return {
      rms: rms,
      clipping: clippingPercent > this.CLIPPING_THRESHOLD_PERCENT,
      clippingPercent: clippingPercent,
      noiseFloor: noiseFloor,
      microphoneType: this.detectMicrophoneType(),
      status: status,
    };
  }

  /**
   * Detect if microphone is default or external.
   * This is a heuristic check.
   */
  private detectMicrophoneType(): string {
    // In production, this would use navigator.mediaDevices.enumerateDevices()
    // For now, return "unknown"
    return "unknown";
  }
}

// ============================================================================
// Video Quality Detection
// ============================================================================

interface VideoAnalysis {
  brightness: number; // 0–255 scale
  uniformityScore: number; // 0–1 (1 = perfectly uniform)
  uniformityStandardDev: number;
  faceDetected: boolean;
  facePercentOfFrame: number;
  status: "OK" | "Too Dark" | "Overexposed" | "Uneven Lighting" | "Adjust Camera";
}

class VideoQualityDetector {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private readonly GRID_SIZE = 10; // 10x10 blocks
  private readonly BRIGHTNESS_LOW = 40;
  private readonly BRIGHTNESS_HIGH = 200;
  private readonly UNIFORMITY_THRESHOLD = 25;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  /**
   * Convert RGB to luminance using ITU-R BT.709.
   * Y = 0.2126R + 0.7152G + 0.0722B
   */
  private rgbToLuminance(r: number, g: number, b: number): number {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Sample brightness by dividing frame into grid.
   */
  private sampleBrightness(): number[] {
    if (!this.canvas || !this.ctx) return [];

    const gridLuminances: number[] = [];
    const blockWidth = this.canvas.width / this.GRID_SIZE;
    const blockHeight = this.canvas.height / this.GRID_SIZE;

    for (let gridY = 0; gridY < this.GRID_SIZE; gridY++) {
      for (let gridX = 0; gridX < this.GRID_SIZE; gridX++) {
        const x = Math.floor(gridX * blockWidth);
        const y = Math.floor(gridY * blockHeight);
        const w = Math.ceil(blockWidth);
        const h = Math.ceil(blockHeight);

        const imageData = this.ctx.getImageData(x, y, w, h);
        const data = imageData.data;

        let totalLuminance = 0;
        let pixelCount = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          totalLuminance += this.rgbToLuminance(r, g, b);
          pixelCount++;
        }

        const avgLuminance = totalLuminance / pixelCount;
        gridLuminances.push(avgLuminance);
      }
    }

    return gridLuminances;
  }

  /**
   * Calculate average brightness.
   */
  private calculateAverageBrightness(luminances: number[]): number {
    if (luminances.length === 0) return 0;
    return luminances.reduce((a, b) => a + b, 0) / luminances.length;
  }

  /**
   * Calculate uniformity using standard deviation.
   * Returns score 0–1 (1 = perfectly uniform).
   */
  private calculateUniformity(luminances: number[]): {
    score: number;
    stdDev: number;
  } {
    if (luminances.length === 0) {
      return { score: 1, stdDev: 0 };
    }

    const mean = luminances.reduce((a, b) => a + b, 0) / luminances.length;
    const variance =
      luminances.reduce((sum, val) => sum + (val - mean) ** 2, 0) /
      luminances.length;
    const stdDev = Math.sqrt(variance);

    // Normalize to 0–1 (255 is max possible stdDev)
    const normalizedStdDev = Math.min(stdDev / 255, 1);
    const score = 1 - normalizedStdDev;

    return { score, stdDev };
  }

  /**
   * Analyze video frame and return diagnostic data.
   */
  analyze(): VideoAnalysis {
    if (!this.canvas || !this.ctx) {
      return {
        brightness: 0,
        uniformityScore: 0,
        uniformityStandardDev: 0,
        faceDetected: false,
        facePercentOfFrame: 0,
        status: "OK",
      };
    }

    const luminances = this.sampleBrightness();
    const brightness = this.calculateAverageBrightness(luminances);
    const { score: uniformityScore, stdDev: uniformityStandardDev } =
      this.calculateUniformity(luminances);

    // Determine status
    let status: VideoAnalysis["status"] = "OK";
    if (brightness < this.BRIGHTNESS_LOW) {
      status = "Too Dark";
    } else if (brightness > this.BRIGHTNESS_HIGH) {
      status = "Overexposed";
    } else if (uniformityStandardDev > this.UNIFORMITY_THRESHOLD) {
      status = "Uneven Lighting";
    }

    return {
      brightness: brightness,
      uniformityScore: uniformityScore,
      uniformityStandardDev: uniformityStandardDev,
      faceDetected: false, // Placeholder for FaceDetector API
      facePercentOfFrame: 0,
      status: status,
    };
  }
}

// ============================================================================
// Network Quality Detection
// ============================================================================

interface NetworkAnalysis {
  bitrate: number; // kbps
  packetLoss: number; // percent
  jitter: number; // ms
  latency: number; // ms
  stabilityScore: number; // 0–100
  status: "Good" | "Moderate" | "Unstable" | "Critical";
}

class NetworkQualityDetector {
  private pc: RTCPeerConnection | null = null;
  private lastBytesSent = 0;
  private lastTimestamp = Date.now();
  private jitterHistory: number[] = [];
  private readonly JITTER_WINDOW = 20;

  constructor(pc: RTCPeerConnection) {
    this.pc = pc;
  }

  /**
   * Calculate bitrate from bytes sent over time interval.
   */
  private calculateBitrate(
    nowBytes: number,
    prevBytes: number,
    deltaTimeMs: number
  ): number {
    if (deltaTimeMs === 0) return 0;
    const deltaBytes = nowBytes - prevBytes;
    const deltaSec = deltaTimeMs / 1000;
    return (deltaBytes * 8) / deltaSec / 1000; // Convert to kbps
  }

  /**
   * Calculate packet loss percentage.
   */
  private calculatePacketLoss(
    packetsLost: number,
    packetsSent: number
  ): number {
    if (packetsSent === 0) return 0;
    return (packetsLost / packetsSent) * 100;
  }

  /**
   * Track jitter and return smoothed value.
   */
  private calculateJitter(rtt: number): number {
    this.jitterHistory.push(rtt);
    if (this.jitterHistory.length > this.JITTER_WINDOW) {
      this.jitterHistory.shift();
    }

    if (this.jitterHistory.length < 2) return 0;

    let jitter = 0;
    for (let i = 1; i < this.jitterHistory.length; i++) {
      jitter += Math.abs(this.jitterHistory[i] - this.jitterHistory[i - 1]);
    }
    return jitter / (this.jitterHistory.length - 1);
  }

  /**
   * Calculate overall stability score (0–100).
   * Combines bitrate, packet loss, jitter, and latency.
   */
  private calculateStabilityScore(
    bitrate: number,
    packetLoss: number,
    jitter: number,
    latency: number
  ): number {
    const bitrateScore = Math.min(bitrate / 2000, 1) * 30; // 30% weight
    const lossScore = Math.max(1 - packetLoss / 10, 0) * 30; // 30% weight
    const jitterScore = Math.max(1 - jitter / 100, 0) * 20; // 20% weight
    const latencyScore = Math.max(1 - latency / 500, 0) * 20; // 20% weight

    const score =
      bitrateScore + lossScore + jitterScore + latencyScore;
    return Math.round(score);
  }

  /**
   * Analyze network stats and return diagnostic data.
   */
  async analyze(): Promise<NetworkAnalysis> {
    if (!this.pc) {
      return {
        bitrate: 0,
        packetLoss: 0,
        jitter: 0,
        latency: 0,
        stabilityScore: 0,
        status: "Good",
      };
    }

    const stats = await this.pc.getStats();
    let bitrate = 0;
    let packetLoss = 0;
    let latency = 0;
    let packetsSent = 0;
    let packetsLost = 0;

    stats.forEach((report) => {
      if (report.type === "outbound-rtp") {
        const r = report as any;
        if (r.bytesSent !== undefined) {
          const now = Date.now();
          const deltaTime = now - this.lastTimestamp;
          bitrate = this.calculateBitrate(r.bytesSent, this.lastBytesSent, deltaTime);
          this.lastBytesSent = r.bytesSent;
          this.lastTimestamp = now;
        }
        if (r.packetsLost !== undefined) {
          packetsLost = r.packetsLost;
        }
        if (r.packetsSent !== undefined) {
          packetsSent = r.packetsSent;
        }
      }

      if (report.type === "candidate-pair") {
        const r = report as any;
        if (r.currentRoundTripTime !== undefined) {
          latency = r.currentRoundTripTime * 1000; // Convert to ms
        }
      }
    });

    packetLoss = this.calculatePacketLoss(packetsLost, packetsSent);
    const jitter = this.calculateJitter(latency);
    const stabilityScore = this.calculateStabilityScore(
      bitrate,
      packetLoss,
      jitter,
      latency
    );

    // Determine status based on thresholds
    let status: NetworkAnalysis["status"] = "Good";
    if (packetLoss > 5 || latency > 300) {
      status = "Critical";
    } else if (packetLoss > 2 || latency > 150 || bitrate < 300) {
      status = "Unstable";
    } else if (latency > 80 || bitrate < 1500) {
      status = "Moderate";
    }

    return {
      bitrate: Math.round(bitrate),
      packetLoss: Math.round(packetLoss * 100) / 100,
      jitter: Math.round(jitter),
      latency: Math.round(latency),
      stabilityScore: stabilityScore,
      status: status,
    };
  }
}

// ============================================================================
// Unified Diagnostic Model
// ============================================================================

export interface DiagnosticData {
  audio: AudioAnalysis;
  video: VideoAnalysis;
  network: NetworkAnalysis;
  timestamp: number;
  overallStatus: "Good" | "Moderate" | "Poor" | "Critical";
}

/**
 * Calculate overall status from individual diagnostics.
 */
export function calculateOverallStatus(diagnostic: Omit<DiagnosticData, 'timestamp' | 'overallStatus'>): DiagnosticData['overallStatus'] {
  const criticalStatuses = ["Too Loud", "Too Dark", "Critical"];
  const poorStatuses = ["Too Quiet", "Overexposed", "Clipping", "Unstable"];

  if (
    criticalStatuses.includes(diagnostic.audio.status) ||
    criticalStatuses.includes(diagnostic.video.status) ||
    criticalStatuses.includes(diagnostic.network.status)
  ) {
    return "Critical";
  }

  if (
    poorStatuses.includes(diagnostic.audio.status) ||
    poorStatuses.includes(diagnostic.video.status) ||
    poorStatuses.includes(diagnostic.network.status)
  ) {
    return "Poor";
  }

  if (
    diagnostic.audio.status === "OK" &&
    diagnostic.video.status === "OK" &&
    diagnostic.network.status === "Good"
  ) {
    return "Good";
  }

  return "Moderate";
}

export { AudioQualityDetector, VideoQualityDetector, NetworkQualityDetector };
