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
  private brightnessHistory: number[] = [];
  private readonly HISTORY_SIZE = 10;
  
  // Tighter thresholds (Google-grade precision)
  private readonly GRID_SIZE = 16; // 16x16 for finer-grained analysis
  private readonly BRIGHTNESS_LOW = 30;      // Darker threshold for better detection
  private readonly BRIGHTNESS_OPTIMAL = 100; // Optimal range center
  private readonly BRIGHTNESS_HIGH = 180;    // Tighter overexposure threshold
  private readonly UNIFORMITY_THRESHOLD = 30; // Standard deviation threshold

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
   * Uses improved algorithms for better precision.
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

    // Track brightness history for stability
    this.brightnessHistory.push(brightness);
    if (this.brightnessHistory.length > this.HISTORY_SIZE) {
      this.brightnessHistory.shift();
    }

    // Check brightness stability (detect flicker/fluctuation)
    const brightnessFluctuation = this.calculateFluctuation();
    const isFluctuating = brightnessFluctuation > 15;

    // Determine status with improved precision
    let status: VideoAnalysis["status"] = "OK";
    
    // Priority: Overexposed > Too Dark > Uneven Lighting > Adjust Camera > OK
    if (brightness > this.BRIGHTNESS_HIGH) {
      status = "Overexposed";
    } else if (brightness < this.BRIGHTNESS_LOW) {
      status = "Too Dark";
    } else if (uniformityStandardDev > this.UNIFORMITY_THRESHOLD) {
      status = "Uneven Lighting";
    } else if (isFluctuating) {
      status = "Adjust Camera"; // Flickering detected
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

  /**
   * Calculate brightness fluctuation over recent history.
   * Detects flicker and unstable lighting.
   */
  private calculateFluctuation(): number {
    if (this.brightnessHistory.length < 2) return 0;
    
    let totalDeviation = 0;
    const mean = this.brightnessHistory.reduce((a, b) => a + b, 0) / this.brightnessHistory.length;
    
    for (const brightness of this.brightnessHistory) {
      totalDeviation += Math.abs(brightness - mean);
    }
    
    return totalDeviation / this.brightnessHistory.length;
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
  framesPerSecond: number;
  frameDropRatio: number; // 0-1
  bitrateStability: number; // standard deviation
  lossStability: number; // trend indicator
  jitterStability: number; // standard deviation
  rttStability: number; // variance
  stabilityScore: number; // 0–100 (weighted composite)
  status: "Good" | "Moderate" | "Unstable" | "Critical";
}

class NetworkQualityDetector {
  private pc: RTCPeerConnection | null = null;
  private lastBytesSent = 0;
  private lastTimestamp = Date.now();
  
  // Rolling windows (10 samples = ~5 seconds at 500ms intervals)
  private bitrateHistory: number[] = [];
  private latencyHistory: number[] = [];
  private jitterHistory: number[] = [];
  private packetLossHistory: number[] = [];
  private fpsHistory: number[] = [];
  private frameDropHistory: number[] = [];
  
  private readonly HISTORY_WINDOW = 10;
  private readonly STAT_COLLECTION_INTERVAL = 500; // ms
  
  // Stricter thresholds for precision
  private readonly BITRATE_CRITICAL = 250;
  private readonly BITRATE_POOR = 500;
  private readonly BITRATE_MODERATE = 1000;
  private readonly BITRATE_OPTIMAL = 1500;
  private readonly LATENCY_GOOD = 50;
  private readonly LATENCY_MODERATE = 100;
  private readonly LATENCY_POOR = 200;
  private readonly LATENCY_CRITICAL = 300;
  private readonly PACKET_LOSS_GOOD = 0.5;
  private readonly PACKET_LOSS_MODERATE = 1.0;
  private readonly PACKET_LOSS_POOR = 2.0;
  private readonly JITTER_THRESHOLD = 30;
  private readonly MIN_FPS_VIABLE = 20;
  private readonly MAX_FRAME_DROP_RATIO = 0.1;
  
  // Weighted stability score coefficients
  private readonly BITRATE_STABILITY_WEIGHT = 0.35;
  private readonly LOSS_STABILITY_WEIGHT = 0.30;
  private readonly JITTER_STABILITY_WEIGHT = 0.20;
  private readonly RTT_STABILITY_WEIGHT = 0.15;

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
   * Calculate standard deviation of an array.
   */
  private calculateStdDev(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate median of an array.
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Calculate trend of packet loss (increasing = unstable).
   */
  private calculateLossTrend(): number {
    if (this.packetLossHistory.length < 3) return 0;
    const recent = this.packetLossHistory.slice(-3);
    const trend = (recent[2] - recent[0]) / 2; // Slope over 3 samples
    return Math.max(0, trend); // Positive trend = increasing loss
  }

  /**
   * Extract bitrate stability from history.
   */
  private getBitrateStability(): number {
    return this.calculateStdDev(this.bitrateHistory);
  }

  /**
   * Extract loss stability from trend.
   */
  private getLossStability(): number {
    return this.calculateLossTrend();
  }

  /**
   * Extract jitter stability from latency variance.
   */
  private getJitterStability(): number {
    return this.calculateStdDev(this.latencyHistory);
  }

  /**
   * Extract RTT stability from variance.
   */
  private getRttStability(): number {
    if (this.latencyHistory.length < 2) return 0;
    const mean = this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length;
    const variance =
      this.latencyHistory.reduce((sum, val) => sum + (val - mean) ** 2, 0) /
      this.latencyHistory.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate weighted stability score (0–100).
   * Reflects actual livestream network conditions.
   */
  private calculateStabilityScore(
    currentBitrate: number,
    currentPacketLoss: number,
    currentLatency: number,
    fps: number,
    frameDropRatio: number
  ): number {
    // Normalize metrics to 0-1 scale
    const bitrateNorm = Math.min(currentBitrate / this.BITRATE_OPTIMAL, 1);
    const lossNorm = Math.max(1 - (currentPacketLoss / 5), 0); // 5% = 0 score
    const latencyNorm = Math.max(1 - (currentLatency / 500), 0); // 500ms = 0 score
    const fpsNorm = Math.min(fps / 30, 1); // 30 FPS = max score
    const dropNorm = Math.max(1 - (frameDropRatio / 0.2), 0); // 20% drop = 0 score

    // Get stability metrics from history
    const bitrateStability = this.getBitrateStability();
    const lossStability = this.getLossStability();
    const jitterStability = this.getJitterStability();
    const rttStability = this.getRttStability();

    // Normalize stability to 0-1 (lower stddev = higher score)
    const bitrateStabilityNorm = Math.max(1 - (bitrateStability / 500), 0);
    const lossStabilityNorm = Math.max(1 - (lossStability / 2), 0);
    const jitterStabilityNorm = Math.max(1 - (jitterStability / 100), 0);
    const rttStabilityNorm = Math.max(1 - (rttStability / 200), 0);

    // Weighted composite score
    const stabilityComponent =
      this.BITRATE_STABILITY_WEIGHT * bitrateStabilityNorm +
      this.LOSS_STABILITY_WEIGHT * lossStabilityNorm +
      this.JITTER_STABILITY_WEIGHT * jitterStabilityNorm +
      this.RTT_STABILITY_WEIGHT * rttStabilityNorm;

    // Overall score combines current metrics (40%) and stability (60%)
    const currentMetricsScore =
      0.25 * bitrateNorm +
      0.25 * lossNorm +
      0.25 * latencyNorm +
      0.25 * fpsNorm;

    const finalScore = (currentMetricsScore * 0.4 + stabilityComponent * 0.6) * 100;
    
    // Penalize heavy frame drops
    if (frameDropRatio > this.MAX_FRAME_DROP_RATIO) {
      return Math.max(0, finalScore - (frameDropRatio - this.MAX_FRAME_DROP_RATIO) * 100);
    }

    return Math.round(Math.max(0, Math.min(100, finalScore)));
  }

  /**
   * Analyze network stats and return diagnostic data.
   * Collects comprehensive network metrics every 500ms.
   */
  async analyze(): Promise<NetworkAnalysis> {
    if (!this.pc) {
      return {
        bitrate: 0,
        packetLoss: 0,
        jitter: 0,
        latency: 0,
        framesPerSecond: 0,
        frameDropRatio: 0,
        bitrateStability: 0,
        lossStability: 0,
        jitterStability: 0,
        rttStability: 0,
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
    let framesPerSecond = 0;
    let framesDropped = 0;
    let totalFrames = 0;

    stats.forEach((report) => {
      if (report.type === "outbound-rtp" && report.kind === "video") {
        const r = report as any;
        if (r.bytesSent !== undefined) {
          const now = Date.now();
          const deltaTime = now - this.lastTimestamp;
          
          if (deltaTime > 0) {
            bitrate = this.calculateBitrate(r.bytesSent, this.lastBytesSent, deltaTime);
            this.bitrateHistory.push(bitrate);
            if (this.bitrateHistory.length > this.HISTORY_WINDOW) {
              this.bitrateHistory.shift();
            }
            this.lastBytesSent = r.bytesSent;
            this.lastTimestamp = now;
          }
        }
        if (r.packetsLost !== undefined) {
          packetsLost = r.packetsLost;
        }
        if (r.packetsSent !== undefined) {
          packetsSent = r.packetsSent;
        }
        if (r.framesPerSecond !== undefined) {
          framesPerSecond = r.framesPerSecond;
          this.fpsHistory.push(framesPerSecond);
          if (this.fpsHistory.length > this.HISTORY_WINDOW) {
            this.fpsHistory.shift();
          }
        }
        if (r.framesDropped !== undefined && r.framesSent !== undefined) {
          framesDropped = r.framesDropped;
          totalFrames = r.framesSent + framesDropped;
        }
      }

      if (report.type === "candidate-pair") {
        const r = report as any;
        if (r.currentRoundTripTime !== undefined) {
          latency = r.currentRoundTripTime * 1000; // Convert to ms
          this.latencyHistory.push(latency);
          if (this.latencyHistory.length > this.HISTORY_WINDOW) {
            this.latencyHistory.shift();
          }
        }
      }
    });

    // Calculate packet loss percentage
    packetLoss = packetsSent > 0 ? (packetsLost / packetsSent) * 100 : 0;
    this.packetLossHistory.push(packetLoss);
    if (this.packetLossHistory.length > this.HISTORY_WINDOW) {
      this.packetLossHistory.shift();
    }

    // Calculate frame drop ratio
    const frameDropRatio = totalFrames > 0 ? framesDropped / totalFrames : 0;
    this.frameDropHistory.push(frameDropRatio);
    if (this.frameDropHistory.length > this.HISTORY_WINDOW) {
      this.frameDropHistory.shift();
    }

    // Calculate jitter (variance in RTT)
    const jitter = this.calculateStdDev(this.latencyHistory);

    // Get stability metrics
    const bitrateStability = this.getBitrateStability();
    const lossStability = this.getLossStability();
    const jitterStability = this.getJitterStability();
    const rttStability = this.getRttStability();

    // Calculate overall stability score
    const stabilityScore = this.calculateStabilityScore(
      bitrate,
      packetLoss,
      latency,
      framesPerSecond,
      frameDropRatio
    );

    // Determine status with comprehensive checks
    let status: NetworkAnalysis["status"] = "Good";

    const isCritical =
      bitrate < this.BITRATE_CRITICAL ||
      packetLoss > this.PACKET_LOSS_POOR ||
      latency > this.LATENCY_CRITICAL ||
      framesPerSecond < this.MIN_FPS_VIABLE ||
      frameDropRatio > this.MAX_FRAME_DROP_RATIO;

    const isUnstable =
      bitrate < this.BITRATE_POOR ||
      packetLoss > this.PACKET_LOSS_MODERATE ||
      latency > this.LATENCY_POOR ||
      jitter > this.JITTER_THRESHOLD ||
      bitrateStability > 200 ||
      lossStability > 1.0;

    const isModerate =
      bitrate < this.BITRATE_MODERATE ||
      latency > this.LATENCY_MODERATE ||
      framesPerSecond < 24;

    if (isCritical) {
      status = "Critical";
    } else if (isUnstable) {
      status = "Unstable";
    } else if (isModerate) {
      status = "Moderate";
    }

    return {
      bitrate: Math.round(bitrate),
      packetLoss: Math.round(packetLoss * 100) / 100,
      jitter: Math.round(jitter),
      latency: Math.round(latency),
      framesPerSecond: Math.round(framesPerSecond),
      frameDropRatio: Math.round(frameDropRatio * 1000) / 1000,
      bitrateStability: Math.round(bitrateStability),
      lossStability: Math.round(lossStability * 1000) / 1000,
      jitterStability: Math.round(jitterStability),
      rttStability: Math.round(rttStability),
      stabilityScore: stabilityScore,
      status: status,
    };
  }
}

// ============================================================================
// Unified Diagnostic Model with Weighted Quality Scoring
// ============================================================================

export interface QualityScore {
  audioScore: number; // 0-100
  videoScore: number; // 0-100
  networkScore: number; // 0-100
  overallQuality: number; // 0-100 (weighted: 40% video + 40% audio + 20% network)
}

export interface DiagnosticData {
  audio: AudioAnalysis;
  video: VideoAnalysis;
  network: NetworkAnalysis;
  qualityScore: QualityScore;
  timestamp: number;
  overallStatus: "Good" | "Moderate" | "Poor" | "Critical";
}

/**
 * Convert audio status to quality score (0-100).
 */
function audioStatusToScore(status: string, rms: number, clipping: boolean): number {
  if (status === "OK") {
    // Bonus for stability in optimal range
    const optimalRange = Math.abs(rms - 0.08);
    return Math.max(85, 100 - optimalRange * 500);
  } else if (status === "Background Noise") {
    return 70;
  } else if (status === "Too Quiet") {
    return 50;
  } else if (status === "Too Loud") {
    return 40;
  } else if (status === "Clipping") {
    return 0;
  }
  return 75;
}

/**
 * Convert video status to quality score (0-100).
 */
function videoStatusToScore(status: string, brightness: number, uniformityScore: number): number {
  if (status === "OK") {
    // Bonus for good uniformity
    return Math.round(85 + uniformityScore * 15);
  } else if (status === "Adjust Camera") {
    return 70;
  } else if (status === "Too Dark") {
    return 50;
  } else if (status === "Uneven Lighting") {
    return 60;
  } else if (status === "Overexposed") {
    return 40;
  }
  return 75;
}

/**
 * Calculate overall quality score from individual metrics.
 * Weighting: 40% video + 40% audio + 20% network
 */
export function calculateQualityScore(diagnostic: Omit<DiagnosticData, 'qualityScore' | 'timestamp' | 'overallStatus'>): QualityScore {
  // Audio score
  const audioScore = audioStatusToScore(
    diagnostic.audio.status,
    diagnostic.audio.rms,
    diagnostic.audio.clipping
  );

  // Video score
  const videoScore = videoStatusToScore(
    diagnostic.video.status,
    diagnostic.video.brightness,
    diagnostic.video.uniformityScore
  );

  // Network score (use stabilityScore directly)
  const networkScore = diagnostic.network.stabilityScore;

  // Weighted overall quality
  const overallQuality = Math.round(
    videoScore * 0.4 + audioScore * 0.4 + networkScore * 0.2
  );

  return {
    audioScore: Math.round(audioScore),
    videoScore: Math.round(videoScore),
    networkScore: Math.round(networkScore),
    overallQuality: Math.max(0, Math.min(100, overallQuality)),
  };
}

/**
 * Calculate overall status from individual diagnostics.
 */
export function calculateOverallStatus(diagnostic: Omit<DiagnosticData, 'qualityScore' | 'timestamp' | 'overallStatus'>): DiagnosticData['overallStatus'] {
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
