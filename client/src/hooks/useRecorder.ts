import { useRef, useState, useEffect } from "react";

export interface Recording {
  url: string;
  timestamp: number;
}

export const useRecorder = (stream: MediaStream | null) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const start = () => {
    if (!stream) return;
    chunksRef.current = [];
    setRecordingTime(0);
    try {
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordings((r) => [{ url, timestamp: Date.now() }, ...r]);
      };

      mr.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Recorder start failed', err);
    }
  };

  const stop = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    mediaRecorderRef.current = null;
  };

  const clear = () => {
    recordings.forEach((r) => URL.revokeObjectURL(r.url));
    setRecordings([]);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isRecording,
    start,
    stop,
    recordings,
    clear,
    recordingTime,
    formattedTime: formatTime(recordingTime),
  };
};
