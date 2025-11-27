import React from "react";
import { DiagnosticData } from "@/lib/qualityDetection";
import { cn } from "@/lib/utils";
import { Mic, Video, Wifi, AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";

interface DiagnosticBadgeProps {
  status: string;
  tooltip?: string;
}

/**
 * Status badge with color coding and optional tooltip.
 */
const DiagnosticBadge: React.FC<DiagnosticBadgeProps> = ({ status, tooltip }) => {
  const getStatusColor = (status: string) => {
    // Green for good/ok statuses
    if (
      status === "OK" ||
      status === "Good" ||
      status === "Moderate" ||
      status === "Adjust Camera"
    ) {
      return "bg-[rgba(52,199,89,0.15)] text-[hsl(34,99%,55%)] border-[rgba(52,199,89,0.3)]";
    }
    // White for warning
    if (status === "Too Quiet" || status === "Too Dark" || status === "Uneven Lighting") {
      return "bg-[rgba(255,255,255,0.15)] text-[rgba(255,255,255,0.9)] border-[rgba(255,255,255,0.3)]";
    }
    // Red for critical
    return "bg-[rgba(255,59,48,0.15)] text-[hsl(0,100%,50%)] border-[rgba(255,59,48,0.3)]";
  };

  return (
    <div className="group relative">
      <div className={cn("px-3 py-1 rounded-full text-xs font-semibold border", getStatusColor(status))}>
        {status}
      </div>
      {tooltip && (
        <div className="absolute hidden group-hover:block bottom-full left-0 mb-2 px-2 py-1 bg-[rgba(var(--card)/0.95)] text-foreground rounded text-xs whitespace-nowrap border border-[rgba(var(--border)/0.5)] z-10">
          {tooltip}
        </div>
      )}
    </div>
  );
};

interface DiagnosticsPanelProps {
  data: DiagnosticData | null;
  isAnalyzing: boolean;
}

/**
 * Full diagnostics panel with audio, video, and network metrics.
 */
export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({ data, isAnalyzing }) => {
  if (!data) {
    return (
      <div className="p-4 rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)]">
        <p className="text-sm text-muted-foreground animate-pulse">Analyzing setup...</p>
      </div>
    );
  }

  const getOverallStatusColor = () => {
    switch (data.overallStatus) {
      case "Good":
        return "border-[rgba(52,199,89,0.3)] bg-[rgba(52,199,89,0.08)]";
      case "Moderate":
        return "border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.08)]";
      case "Poor":
        return "border-[rgba(255,167,38,0.3)] bg-[rgba(255,167,38,0.08)]";
      case "Critical":
        return "border-[rgba(255,59,48,0.3)] bg-[rgba(255,59,48,0.08)]";
      default:
        return "";
    }
  };

  const getOverallStatusTextColor = () => {
    switch (data.overallStatus) {
      case "Good":
        return "text-[hsl(34,99%,55%)]";
      case "Moderate":
        return "text-[rgba(255,255,255,0.9)]";
      case "Poor":
        return "text-[hsl(30,100%,50%)]";
      case "Critical":
        return "text-[hsl(0,100%,50%)]";
      default:
        return "text-foreground";
    }
  };

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <div className={cn("p-4 rounded-2xl border", getOverallStatusColor())}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {data.overallStatus === "Good" && (
              <CheckCircle className="w-5 h-5 text-[hsl(34,99%,55%)]" />
            )}
            {data.overallStatus === "Moderate" && (
              <AlertTriangle className="w-5 h-5 text-[rgba(255,255,255,0.9)]" />
            )}
            {(data.overallStatus === "Poor" || data.overallStatus === "Critical") && (
              <AlertCircle className="w-5 h-5 text-[hsl(0,100%,50%)]" />
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">Overall Status</p>
              <p className={cn("text-sm font-semibold", getOverallStatusTextColor())}>
                {data.overallStatus}
              </p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(data.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Audio</h3>
        </div>
        <div className="space-y-2 bg-[rgba(var(--secondary),0.03)] p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Level (RMS)</span>
            <span className="text-xs font-mono text-foreground font-semibold">
              {(data.audio.rms * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Clipping</span>
            <span className="text-xs font-mono text-foreground font-semibold">
              {data.audio.clippingPercent.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Noise Floor</span>
            <span className="text-xs font-mono text-foreground font-semibold">
              {(data.audio.noiseFloor * 1000).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-[rgba(255,255,255,0.05)]">
            <span className="text-xs text-muted-foreground">Status</span>
            <DiagnosticBadge status={data.audio.status} />
          </div>
        </div>
      </div>

      {/* Video Diagnostics */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Video</h3>
        </div>
        <div className="space-y-2 bg-[rgba(var(--secondary),0.03)] p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Brightness</span>
            <span className="text-xs font-mono text-foreground font-semibold">
              {data.video.brightness.toFixed(0)}/255
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Uniformity</span>
            <span className="text-xs font-mono text-foreground font-semibold">
              {(data.video.uniformityScore * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Std Dev</span>
            <span className="text-xs font-mono text-foreground font-semibold">
              {data.video.uniformityStandardDev.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-[rgba(255,255,255,0.05)]">
            <span className="text-xs text-muted-foreground">Status</span>
            <DiagnosticBadge status={data.video.status} />
          </div>
        </div>
      </div>

      {/* Network Diagnostics */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Network</h3>
        </div>
        <div className="space-y-2 bg-[rgba(255,255,255,0.04)] p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Bitrate</span>
              <div className="group relative">
                <Info className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
                <div className="absolute hidden group-hover:block right-0 mb-2 px-2 py-1 bg-[rgba(0,0,0,0.8)] text-white rounded text-[10px] whitespace-nowrap z-10 bottom-full">
                  Network speed (300-1500 kbps ideal)
                </div>
              </div>
            </div>
            <span className="text-xs font-mono text-foreground font-semibold">
              {Math.round(data.network.bitrate)} kbps
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Latency</span>
              <div className="group relative">
                <Info className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
                <div className="absolute hidden group-hover:block right-0 mb-2 px-2 py-1 bg-[rgba(0,0,0,0.8)] text-white rounded text-[10px] whitespace-nowrap z-10 bottom-full">
                  Connection delay (under 50 ms ideal)
                </div>
              </div>
            </div>
            <span className="text-xs font-mono text-foreground font-semibold">
              {Math.round(data.network.latency)} ms
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Jitter</span>
              <div className="group relative">
                <Info className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
                <div className="absolute hidden group-hover:block right-0 mb-2 px-2 py-1 bg-[rgba(0,0,0,0.8)] text-white rounded text-[10px] whitespace-nowrap z-10 bottom-full">
                  Latency variation (under 10 ms ideal)
                </div>
              </div>
            </div>
            <span className="text-xs font-mono text-foreground font-semibold">
              {Math.round(data.network.jitter)} ms
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Packet Loss</span>
              <div className="group relative">
                <Info className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
                <div className="absolute hidden group-hover:block right-0 mb-2 px-2 py-1 bg-[rgba(0,0,0,0.8)] text-white rounded text-[10px] whitespace-nowrap z-10 bottom-full">
                  Missing data packets (under 1% ideal)
                </div>
              </div>
            </div>
            <span className="text-xs font-mono text-foreground font-semibold">
              {(data.network.packetLoss * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-[rgba(255,255,255,0.05)]">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Status</span>
              <div className="group relative">
                <Info className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
                <div className="absolute hidden group-hover:block right-0 mb-2 px-2 py-1 bg-[rgba(0,0,0,0.8)] text-white rounded text-[10px] whitespace-nowrap z-10 bottom-full">
                  Overall network health
                </div>
              </div>
            </div>
            <DiagnosticBadge status={data.network.status} />
          </div>
        </div>
      </div>

      {isAnalyzing && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-foreground/50 animate-pulse" />
          Analyzing...
        </div>
      )}
    </div>
  );
};
