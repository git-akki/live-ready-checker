import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface VideoPreviewProps {
  stream: MediaStream | null;
  error?: string;
}

export const VideoPreview = ({ stream, error }: VideoPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (error) {
    return (
      <Card className="bg-[linear-gradient(180deg,rgba(var(--card)/0.9),transparent)] aspect-video flex items-center justify-center rounded-2xl border border-[rgba(var(--border)/0.5)]">
        <div className="text-center space-y-4 p-6">
          <div className="w-14 h-14 bg-[rgba(var(--destructive)/0.12)] rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7 text-destructive" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">Camera/Microphone Error</p>
            <p className="text-sm text-muted-foreground max-w-md">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-[linear-gradient(180deg,rgba(var(--card)/0.85),transparent)] overflow-hidden rounded-2xl border border-[rgba(var(--border)/0.5)] shadow-sm">
      <div className="aspect-video bg-black relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        <div className="absolute left-4 bottom-4 flex items-center gap-3 bg-[rgba(var(--background)/0.35)] px-3 py-1 rounded-full backdrop-blur-sm border border-[rgba(var(--border)/0.4)] status-pulse">
          <div className="w-2 h-2 rounded-full bg-[hsl(0,0%,100%)]" />
          <span className="text-xs text-foreground">Preview</span>
        </div>

        {!stream && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 border-4 border-[hsl(0,0%,100%)] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Accessing camera...</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
