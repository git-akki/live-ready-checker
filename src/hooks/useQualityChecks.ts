import { useState, useEffect, useRef } from "react";

type NetworkQuality = "good" | "fair" | "poor";

export const useQualityChecks = (stream: MediaStream | null) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [lightingScore, setLightingScore] = useState(0);
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>("good");
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Audio level monitoring
  useEffect(() => {
    if (!stream) return;

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 256;
    microphone.connect(analyser);
    
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const checkAudioLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 255);
      
      requestAnimationFrame(checkAudioLevel);
    };
    
    checkAudioLevel();

    return () => {
      microphone.disconnect();
      analyser.disconnect();
      audioContext.close();
    };
  }, [stream]);

  // Lighting analysis
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
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        totalBrightness += brightness;
      }
      
      const averageBrightness = totalBrightness / (data.length / 4);
      setLightingScore(averageBrightness);
      
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

  // Network quality simulation (in real app, this would use WebRTC stats)
  useEffect(() => {
    const checkNetwork = () => {
      // Simulate network quality check
      const qualities: NetworkQuality[] = ["good", "fair", "poor"];
      const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
      setNetworkQuality(randomQuality);
    };

    const interval = setInterval(checkNetwork, 5000);
    checkNetwork();

    return () => clearInterval(interval);
  }, []);

  return { audioLevel, lightingScore, networkQuality };
};
