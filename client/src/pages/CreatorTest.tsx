import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { VideoPreview } from "@/components/VideoPreview";
import { QualityIndicator } from "@/components/QualityIndicator";
import { QualityTips } from "@/components/QualityTips";
import { useMediaStream } from "@/hooks/useMediaStream";
import { useQualityChecks } from "@/hooks/useQualityChecks";
import { useQualityDiagnostics } from "@/hooks/useDiagnostics";
import { useRecorder } from "@/hooks/useRecorder";
import { RecordingModal } from "@/components/RecordingModal";
import { DiagnosticsPanel } from "@/components/DiagnosticsPanel";
import { Copy, Video, Mic, Wifi, Sun, Circle, Info } from "lucide-react";

const CreatorTest = () => {
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  const { stream, error: streamError, startStream } = useMediaStream();
  const { audioStatus, lightingStatus, networkStatus, metrics } = useQualityChecks(stream);
  const { diagnosticData, isAnalyzing } = useQualityDiagnostics(stream, null);
  const { isRecording, start, stop, recordings, clear, formattedTime } = useRecorder(stream);
  const [isRecModalOpen, setRecModalOpen] = useState(false);

  useEffect(() => {
    startStream();
  }, []);

  const generatePreviewLink = async () => {
    setIsGenerating(true);
    
    // Generate a unique session ID
    const sessionId = Math.random().toString(36).substring(2, 15);
    const url = `${window.location.origin}/preview/${sessionId}`;
    
    setPreviewUrl(url);
    setIsGenerating(false);
    
    toast({
      title: "Preview link generated!",
      description: "Share this link with your viewers",
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(previewUrl);
    toast({
      title: "Copied!",
      description: "Preview link copied to clipboard",
    });
  };

  const getStatusVariant = (status: string): "good" | "warning" | "error" => {
    if (status === "OK" || status === "Good Lighting" || status === "Good") {
      return "good";
    }
    if (status === "Too Quiet" || status === "Too Dark" || status === "Moderate" || status === "Uneven Lighting") {
      return "warning";
    }
    return "error";
  };

  const allGood = audioStatus === "OK" && 
                  lightingStatus === "Good Lighting" && 
                  networkStatus === "Good";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-[rgba(255,255,255,0.02)]">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-[hsl(34,99%,55%)] animate-pulse" />
            <span className="text-xs font-semibold text-muted-foreground">Live Preview Studio</span>
          </div>
          <h1 className="text-6xl font-bold text-foreground tracking-tight">Creator Live Preview</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Test your audio, video, and network quality before going live. Get detailed diagnostics and real-time feedback.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Video Preview */}
            <div className="relative">
              <VideoPreview stream={stream} error={streamError} />
              {isRecording && (
                <div className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500/20 to-red-500/10 border border-red-500/30 backdrop-blur-sm animate-pulse">
                  <Circle className="w-3 h-3 fill-red-500 text-red-500" />
                  <span className="text-sm font-bold text-red-400">{formattedTime}</span>
                </div>
              )}
            </div>

            {/* Quality Tips */}
            <QualityTips 
              audioStatus={audioStatus}
              lightingStatus={lightingStatus}
              networkStatus={networkStatus}
            />
            
            {/* Ready State */}
            {allGood && (
              <div className="p-6 rounded-2xl text-center animate-fade-in border border-[rgba(52,199,89,0.3)] bg-gradient-to-r from-[rgba(52,199,89,0.08)] to-[rgba(52,199,89,0.03)]">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[hsl(34,99%,55%)] animate-pulse" />
                  <p className="text-lg font-bold text-[hsl(34,99%,55%)]">All systems ready!</p>
                  <div className="w-2 h-2 rounded-full bg-[hsl(34,99%,55%)] animate-pulse" />
                </div>
                <p className="text-sm text-[hsl(34,99%,55%)]/70">Your setup looks perfect for streaming</p>
              </div>
            )}

            {/* Recording Controls */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  if (isRecording) stop(); else start();
                }}
                className={`flex-1 min-w-[140px] font-semibold text-base py-6 transition-all shadow-lg hover:shadow-xl ${
                  isRecording 
                    ? 'bg-white hover:bg-white/90 text-black' 
                    : 'bg-white hover:bg-white/90 text-black'
                }`}
              >
                <Circle className={`w-5 h-5 mr-2 ${isRecording ? 'fill-current animate-pulse' : 'fill-current'}`} />
                {isRecording ? `Recording (${formattedTime})` : 'Start Recording'}
              </Button>

              <Button
                onClick={() => setRecModalOpen(true)}
                disabled={recordings.length === 0}
                className="flex-1 min-w-[140px] font-semibold bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] text-foreground border border-[rgba(255,255,255,0.1)] py-6"
              >
                <Video className="w-5 h-5 mr-2" />
                View ({recordings.length})
              </Button>

              <Button
                onClick={() => clear()}
                disabled={recordings.length === 0}
                variant="ghost"
                className="px-4 py-6 text-muted-foreground hover:text-foreground hover:bg-[rgba(255,255,255,0.05)]"
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quality Checks Card */}
            <Card className="bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.08)] backdrop-blur-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[rgba(52,199,89,0.2)] to-[rgba(52,199,89,0.05)] border border-[rgba(52,199,89,0.2)] flex items-center justify-center">
                  <Video className="w-5 h-5 text-[hsl(34,99%,55%)]" />
                </div>
                  <h2 className="text-base font-bold text-foreground">Quality Checks</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDiagnostics(!showDiagnostics)}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)]"
                >
                  {showDiagnostics ? "Simple" : "Advanced"}
                </Button>
              </div>
              
              {showDiagnostics && diagnosticData ? (
                <DiagnosticsPanel data={diagnosticData} isAnalyzing={isAnalyzing} />
              ) : (
                <div className="space-y-3">
                  <QualityIndicator
                    icon={<Mic className="w-4 h-4" />}
                    label="Audio"
                    status={audioStatus}
                    variant={getStatusVariant(audioStatus)}
                  />
                  
                  <QualityIndicator
                    icon={<Sun className="w-4 h-4" />}
                    label="Lighting"
                    status={lightingStatus}
                    variant={getStatusVariant(lightingStatus)}
                  />
                  
                  <QualityIndicator
                    icon={<Wifi className="w-4 h-4" />}
                    label="Network"
                    status={networkStatus}
                    variant={getStatusVariant(networkStatus)}
                  />
                </div>
              )}
              
              {metrics && !showDiagnostics && (
                <div className="pt-4 border-t border-[rgba(255,255,255,0.05)] space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Quick Metrics</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-[rgba(255,255,255,0.06)] to-[rgba(255,255,255,0.02)] rounded-lg p-3 border border-[rgba(255,255,255,0.05)]">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-[11px] font-semibold uppercase">Bitrate</p>
                        <div className="group relative">
                          <Info className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
                          <div className="absolute hidden group-hover:block right-0 mb-2 px-2 py-1 bg-[rgba(0,0,0,0.8)] text-white rounded text-[10px] whitespace-nowrap z-10 bottom-full">
                            Network speed (300-1500 kbps recommended)
                          </div>
                        </div>
                      </div>
                      <p className="font-mono text-foreground font-bold text-sm mt-1">{Math.round(metrics.networkBitrate)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">kbps</p>
                    </div>
                    <div className="bg-gradient-to-br from-[rgba(255,255,255,0.06)] to-[rgba(255,255,255,0.02)] rounded-lg p-3 border border-[rgba(255,255,255,0.05)]">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-[11px] font-semibold uppercase">Latency</p>
                        <div className="group relative">
                          <Info className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
                          <div className="absolute hidden group-hover:block right-0 mb-2 px-2 py-1 bg-[rgba(0,0,0,0.8)] text-white rounded text-[10px] whitespace-nowrap z-10 bottom-full">
                            Connection delay (under 50 ms ideal)
                          </div>
                        </div>
                      </div>
                      <p className="font-mono text-foreground font-bold text-sm mt-1">{Math.round(metrics.latency)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">ms</p>
                    </div>
                    <div className="bg-gradient-to-br from-[rgba(255,255,255,0.06)] to-[rgba(255,255,255,0.02)] rounded-lg p-3 border border-[rgba(255,255,255,0.05)]">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-[11px] font-semibold uppercase">Audio</p>
                        <div className="group relative">
                          <Info className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
                          <div className="absolute hidden group-hover:block right-0 mb-2 px-2 py-1 bg-[rgba(0,0,0,0.8)] text-white rounded text-[10px] whitespace-nowrap z-10 bottom-full">
                            Microphone signal strength
                          </div>
                        </div>
                      </div>
                      <p className="font-mono text-foreground font-bold text-sm mt-1">{Math.round(metrics.audioLevel * 100)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">%</p>
                    </div>
                    <div className="bg-gradient-to-br from-[rgba(255,255,255,0.06)] to-[rgba(255,255,255,0.02)] rounded-lg p-3 border border-[rgba(255,255,255,0.05)]">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-[11px] font-semibold uppercase">Light</p>
                        <div className="group relative">
                          <Info className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
                          <div className="absolute hidden group-hover:block right-0 mb-2 px-2 py-1 bg-[rgba(0,0,0,0.8)] text-white rounded text-[10px] whitespace-nowrap z-10 bottom-full">
                            Brightness level (40-180 optimal)
                          </div>
                        </div>
                      </div>
                      <p className="font-mono text-foreground font-bold text-sm mt-1">{Math.round(metrics.lightingScore)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">/255</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Share Preview Card */}
            <Card className="bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.08)] backdrop-blur-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[rgba(52,199,89,0.2)] to-[rgba(52,199,89,0.05)] border border-[rgba(52,199,89,0.2)] flex items-center justify-center">
                  <Copy className="w-5 h-5 text-[hsl(34,99%,55%)]" />
                </div>
                <h2 className="text-base font-bold text-foreground">Share Preview</h2>
              </div>
              
              <Button
                onClick={generatePreviewLink}
                disabled={isGenerating || !stream}
                className="w-full bg-white hover:bg-white/90 text-black font-bold py-6 shadow-lg hover:shadow-xl transition-all"
              >
                {isGenerating ? "Generating..." : "Generate Link"}
              </Button>

              {previewUrl && (
                <div className="space-y-3 pt-3 border-t border-[rgba(255,255,255,0.05)]">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={previewUrl}
                      readOnly
                      className="flex-1 px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(34,99%,55%)]/20"
                    />
                    <Button
                      onClick={copyToClipboard}
                      size="icon"
                      className="bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.1)]"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Share this link to let viewers preview your stream before going live
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
      <RecordingModal open={isRecModalOpen} onClose={() => setRecModalOpen(false)} recordings={recordings} />
    </div>
  );
};

export default CreatorTest;
