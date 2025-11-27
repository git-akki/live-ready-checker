import { useState, useEffect, useRef } from "react";
import {
  AudioQualityDetector,
  VideoQualityDetector,
  NetworkQualityDetector,
  DiagnosticData,
  calculateOverallStatus,
} from "@/lib/qualityDetection";

/**
 * Enhanced hook for comprehensive quality diagnostics.
 * Runs all detectors with < 10ms target per frame.
 */
export const useQualityDiagnostics = (
  stream: MediaStream | null,
  pc: RTCPeerConnection | null
) => {
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const audioDetectorRef = useRef<AudioQualityDetector | null>(null);
  const videoDetectorRef = useRef<VideoQualityDetector | null>(null);
  const networkDetectorRef = useRef<NetworkQualityDetector | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Audio setup
  useEffect(() => {
    if (!stream) {
      audioDetectorRef.current = null;
      return;
    }

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      audioDetectorRef.current = new AudioQualityDetector(analyser);

      return () => {
        microphone.disconnect();
        analyser.disconnect();
        audioContext.close();
      };
    } catch (err) {
      console.error("Audio setup failed:", err);
    }
  }, [stream]);

  // Video setup
  useEffect(() => {
    if (!stream) {
      videoDetectorRef.current = null;
      return;
    }

    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) return;

    video.srcObject = stream;
    video.play();

    videoRef.current = video;
    canvasRef.current = canvas;

    const onLoadedMetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      videoDetectorRef.current = new VideoQualityDetector(canvas, ctx);
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.pause();
      video.srcObject = null;
    };
  }, [stream]);

  // Network setup
  useEffect(() => {
    if (!pc) {
      networkDetectorRef.current = null;
      return;
    }

    networkDetectorRef.current = new NetworkQualityDetector(pc);
  }, [pc]);

  // Main analysis loop (updates every 500ms–1s)
  useEffect(() => {
    if (!audioDetectorRef.current && !videoDetectorRef.current) {
      return;
    }

    setIsAnalyzing(true);
    const startTime = performance.now();

    const runAnalysis = async () => {
      try {
        // Audio analysis
        const audio = audioDetectorRef.current?.analyze() || {
          rms: 0,
          clipping: false,
          clippingPercent: 0,
          noiseFloor: 0,
          microphoneType: "unknown",
          status: "OK" as const,
        };

        // Video analysis
        if (videoRef.current && canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d", {
            willReadFrequently: true,
          });
          if (ctx) {
            ctx.drawImage(
              videoRef.current,
              0,
              0,
              canvasRef.current.width,
              canvasRef.current.height
            );
          }
        }

        const video = videoDetectorRef.current?.analyze() || {
          brightness: 0,
          uniformityScore: 0,
          uniformityStandardDev: 0,
          faceDetected: false,
          facePercentOfFrame: 0,
          status: "OK" as const,
        };

        // Network analysis
        const network = await (networkDetectorRef.current?.analyze() || {
          bitrate: 0,
          packetLoss: 0,
          jitter: 0,
          latency: 0,
          stabilityScore: 0,
          status: "Good" as const,
        });

        const diagnostic: DiagnosticData = {
          audio,
          video,
          network,
          timestamp: Date.now(),
          overallStatus: calculateOverallStatus({ audio, video, network }),
        };

        setDiagnosticData(diagnostic);

        const elapsed = performance.now() - startTime;
        console.debug(`Analysis completed in ${elapsed.toFixed(2)}ms`);
      } catch (err) {
        console.error("Analysis failed:", err);
      } finally {
        setIsAnalyzing(false);
      }
    };

    // Schedule next analysis
    const interval = setInterval(runAnalysis, 1000); // Every 1 second

    // Initial run
    runAnalysis();

    return () => clearInterval(interval);
  }, []);

  return {
    diagnosticData,
    isAnalyzing,
    audioDetector: audioDetectorRef.current,
    videoDetector: videoDetectorRef.current,
    networkDetector: networkDetectorRef.current,
  };
};
