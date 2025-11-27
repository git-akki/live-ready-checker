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
      <Card className="bg-card aspect-video flex items-center justify-center">
        <div className="text-center space-y-4 p-6">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">
              Camera/Microphone Error
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              {error}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-card overflow-hidden">
      <div className="aspect-video bg-secondary relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!stream && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">
                Accessing camera...
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
