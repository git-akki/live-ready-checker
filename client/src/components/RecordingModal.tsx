import React from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Play } from "lucide-react";
import type { Recording } from "@/hooks/useRecorder";

interface RecordingModalProps {
  open: boolean;
  onClose: () => void;
  recordings: Recording[];
}

export const RecordingModal: React.FC<RecordingModalProps> = ({ open, onClose, recordings }) => {
  if (!open) return null;

  const latest = recordings[0];

  const downloadAsMP4 = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `recording-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-[92vw] max-w-3xl rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-[rgba(34,197,94,0.2)] to-[rgba(34,197,94,0.05)] border border-[rgba(34,197,94,0.2)]">
              <Play className="w-5 h-5 text-[hsl(34,99%,55%)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Recording Playback</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {latest ? `Saved at ${formatTime(latest.timestamp)}` : "No recordings"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.08)] transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {latest ? (
            <div className="space-y-4">
              {/* Video Player */}
              <div className="relative group rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)] bg-black">
                <video
                  src={latest.url}
                  controls
                  className="w-full h-auto aspect-video object-cover"
                  controlsList="nodownload"
                />
                <div className="absolute inset-0 rounded-xl border border-[rgba(255,255,255,0.05)] pointer-events-none" />
              </div>

              {/* Metadata and Actions */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.2)]">
                    <div className="w-2 h-2 rounded-full bg-[hsl(34,99%,55%)] animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Ready to download</p>
                    <p className="text-xs text-muted-foreground">Video recorded successfully</p>
                  </div>
                </div>
                <Button
                  onClick={() => downloadAsMP4(latest.url)}
                  className="bg-white hover:bg-white/90 text-black font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download MP4
                </Button>
              </div>

              {/* Info Footer */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
                  <p className="text-xs text-muted-foreground">Format</p>
                  <p className="text-sm font-semibold text-foreground mt-1">MP4 Video</p>
                </div>
                <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
                  <p className="text-xs text-muted-foreground">Codec</p>
                  <p className="text-sm font-semibold text-foreground mt-1">H.264</p>
                </div>
                <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
                  <p className="text-xs text-muted-foreground">Resolution</p>
                  <p className="text-sm font-semibold text-foreground mt-1">Full HD</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] mb-4">
                <Play className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-base font-medium text-foreground">No recordings yet</p>
              <p className="text-sm text-muted-foreground mt-1">Start recording to see playback here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

