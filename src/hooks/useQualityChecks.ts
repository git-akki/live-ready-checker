import { useState, useEffect, useRef } from "react";

type AudioStatus = "OK" | "Too Quiet" | "Too Loud" | "Background Noise" | "No Mic";
type LightingStatus = "Good Lighting" | "Too Dark" | "Overexposed" | "Uneven Lighting";
type NetworkStatus = "Good" | "Moderate" | "Unstable" | "Critical";

interface QualityMetrics {
  audioLevel: number;
  isClipping: boolean;
  hasBackgroundNoise: boolean;
  lightingScore: number;
  overexposureRatio: number;
  unevenLighting: boolean;
  networkBitrate: number;
  packetLoss: number;
  latency: number;
}

export const useQualityChecks = (stream: MediaStream | null) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isClipping, setIsClipping] = useState(false);
  const [hasBackgroundNoise, setHasBackgroundNoise] = useState(false);
  const [lightingScore, setLightingScore] = useState(0);
  const [overexposureRatio, setOverexposureRatio] = useState(0);
  const [unevenLighting, setUnevenLighting] = useState(false);
  const [networkBitrate, setNetworkBitrate] = useState(0);
  const [packetLoss, setPacketLoss] = useState(0);
  const [latency, setLatency] = useState(0);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>("OK");
  const [lightingStatus, setLightingStatus] = useState<LightingStatus>("Good Lighting");
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>("Good");
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Enhanced audio analysis
  useEffect(() => {
    if (!stream) {
      setAudioStatus("No Mic");
      return;
    }

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) {
      setAudioStatus("No Mic");
      return;
    }

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    microphone.connect(analyser);
    
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const timeDataArray = new Uint8Array(analyser.fftSize);
    let clipCount = 0;
    let frameCount = 0;
    
    const checkAudioLevel = () => {
      if (!analyserRef.current) return;
      
      // Frequency analysis for volume
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const normalizedLevel = average / 255;
      setAudioLevel(normalizedLevel);
      
      // Time domain analysis for clipping
      analyserRef.current.getByteTimeDomainData(timeDataArray);
      const isCurrentlyClipping = timeDataArray.some(v => v >= 250 || v <= 5);
      if (isCurrentlyClipping) clipCount++;
      
      frameCount++;
      
      // Update clipping status every 30 frames
      if (frameCount % 30 === 0) {
        setIsClipping(clipCount > 3);
        clipCount = 0;
      }
      
      // Background noise detection (high activity in low frequencies)
      const lowFreqEnergy = dataArray.slice(0, 10).reduce((a, b) => a + b) / 10;
      setHasBackgroundNoise(lowFreqEnergy > 30 && normalizedLevel < 0.2);
      
      // Determine audio status
      if (normalizedLevel < 0.05) {
        setAudioStatus("Too Quiet");
      } else if (isCurrentlyClipping && clipCount > 3) {
        setAudioStatus("Too Loud");
      } else if (lowFreqEnergy > 30 && normalizedLevel < 0.2) {
        setAudioStatus("Background Noise");
      } else {
        setAudioStatus("OK");
      }
      
      requestAnimationFrame(checkAudioLevel);
    };
    
    checkAudioLevel();

    return () => {
      microphone.disconnect();
      analyser.disconnect();
      audioContext.close();
    };
  }, [stream]);

  // Enhanced lighting analysis
  useEffect(() => {
    if (!stream) return;

    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    
    if (!ctx) return;

    video.srcObject = stream;
    video.play();
    
    videoRef.current = video;
    canvasRef.current = canvas;

    const checkLighting = () => {
      if (!ctx || !video.videoWidth) {
        requestAnimationFrame(checkLighting);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let totalBrightness = 0;
      let overexposedPixels = 0;
      const pixelCount = data.length / 4;
      
      // Divide image into quadrants for evenness check
      const quadrants = [0, 0, 0, 0];
      const quadrantCounts = [0, 0, 0, 0];
      
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        totalBrightness += brightness;
        
        // Check for overexposure
        if (brightness > 240) {
          overexposedPixels++;
        }
        
        // Calculate quadrant
        const pixelIndex = i / 4;
        const x = pixelIndex % canvas.width;
        const y = Math.floor(pixelIndex / canvas.width);
        const quadrantX = x < canvas.width / 2 ? 0 : 1;
        const quadrantY = y < canvas.height / 2 ? 0 : 1;
        const quadrantIndex = quadrantY * 2 + quadrantX;
        
        quadrants[quadrantIndex] += brightness;
        quadrantCounts[quadrantIndex]++;
      }
      
      const averageBrightness = totalBrightness / pixelCount;
      setLightingScore(averageBrightness);
      
      const overexposedRatio = overexposedPixels / pixelCount;
      setOverexposureRatio(overexposedRatio);
      
      // Check lighting evenness
      const quadrantAverages = quadrants.map((sum, i) => sum / quadrantCounts[i]);
      const maxDiff = Math.max(...quadrantAverages) - Math.min(...quadrantAverages);
      setUnevenLighting(maxDiff > 60);
      
      // Determine lighting status
      if (averageBrightness < 60) {
        setLightingStatus("Too Dark");
      } else if (overexposedRatio > 0.15) {
        setLightingStatus("Overexposed");
      } else if (maxDiff > 60) {
        setLightingStatus("Uneven Lighting");
      } else {
        setLightingStatus("Good Lighting");
      }
      
      setTimeout(checkLighting, 1000);
    };
    
    video.onloadedmetadata = () => {
      checkLighting();
    };

    return () => {
      video.pause();
      video.srcObject = null;
    };
  }, [stream]);

  // Network quality estimation using WebRTC loopback
  useEffect(() => {
    let peerConnection: RTCPeerConnection | null = null;
    let statsInterval: NodeJS.Timeout | null = null;

    const setupNetworkCheck = async () => {
      try {
        peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        // Create a loopback connection for stats
        if (stream) {
          stream.getTracks().forEach(track => {
            peerConnection?.addTrack(track, stream);
          });
        }

        // Create offer and set local description
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        // Monitor stats
        statsInterval = setInterval(async () => {
          if (!peerConnection) return;

          const stats = await peerConnection.getStats();
          let totalBitrate = 0;
          let totalPacketLoss = 0;
          let totalLatency = 0;
          let statCount = 0;

          stats.forEach((report) => {
            if (report.type === 'outbound-rtp') {
              // Estimate bitrate from bytes sent
              if (report.bytesSent) {
                totalBitrate += (report.bytesSent * 8) / 1000; // Convert to kbps
              }
              
              // Packet loss
              if (report.packetsLost !== undefined) {
                totalPacketLoss += report.packetsLost;
              }
              
              statCount++;
            }
            
            if (report.type === 'candidate-pair' && report.currentRoundTripTime) {
              totalLatency += report.currentRoundTripTime * 1000; // Convert to ms
            }
          });

          // Update metrics
          setNetworkBitrate(totalBitrate);
          setPacketLoss(totalPacketLoss);
          setLatency(totalLatency);

          // Determine network status
          if (totalPacketLoss > 10 || totalLatency > 300) {
            setNetworkStatus("Critical");
          } else if (totalPacketLoss > 5 || totalLatency > 150 || totalBitrate < 500) {
            setNetworkStatus("Unstable");
          } else if (totalLatency > 80 || totalBitrate < 1000) {
            setNetworkStatus("Moderate");
          } else {
            setNetworkStatus("Good");
          }
        }, 2000);

      } catch (error) {
        console.error("Network check setup failed:", error);
        setNetworkStatus("Moderate");
      }
    };

    if (stream) {
      setupNetworkCheck();
    }

    return () => {
      if (statsInterval) clearInterval(statsInterval);
      if (peerConnection) peerConnection.close();
    };
  }, [stream]);

  const metrics: QualityMetrics = {
    audioLevel,
    isClipping,
    hasBackgroundNoise,
    lightingScore,
    overexposureRatio,
    unevenLighting,
    networkBitrate,
    packetLoss,
    latency,
  };

  return { 
    audioLevel, 
    lightingScore, 
    audioStatus,
    lightingStatus,
    networkStatus,
    metrics
  };
};
