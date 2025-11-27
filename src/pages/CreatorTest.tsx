import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { VideoPreview } from "@/components/VideoPreview";
import { QualityIndicator } from "@/components/QualityIndicator";
import { QualityTips } from "@/components/QualityTips";
import { ChatSimulation } from "@/components/ChatSimulation";
import { useMediaStream } from "@/hooks/useMediaStream";
import { useQualityChecks } from "@/hooks/useQualityChecks";
import { Copy, Video, Mic, Wifi, Sun } from "lucide-react";

const CreatorTest = () => {
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { stream, error: streamError, startStream } = useMediaStream();
  const { audioStatus, lightingStatus, networkStatus, metrics } = useQualityChecks(stream);

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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Creator Live Preview</h1>
          <p className="text-muted-foreground">Test your setup before going live</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <VideoPreview stream={stream} error={streamError} />
            
            <QualityTips 
              audioStatus={audioStatus}
              lightingStatus={lightingStatus}
              networkStatus={networkStatus}
            />
            
            {allGood && (
              <Card className="bg-card border-status-good/30 p-6 text-center animate-fade-in">
                <p className="text-xl font-semibold text-status-good">
                  ✨ You're ready to go live!
                </p>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card className="bg-card p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Video className="w-5 h-5" />
                Quality Checks
              </h2>
              
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
              
              {metrics && (
                <div className="pt-3 border-t border-border space-y-2">
                  <p className="text-xs text-muted-foreground">Technical Metrics</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-secondary/50 rounded p-2">
                      <p className="text-muted-foreground">Bitrate</p>
                      <p className="font-mono text-foreground">{Math.round(metrics.networkBitrate)} kbps</p>
                    </div>
                    <div className="bg-secondary/50 rounded p-2">
                      <p className="text-muted-foreground">Latency</p>
                      <p className="font-mono text-foreground">{Math.round(metrics.latency)} ms</p>
                    </div>
                    <div className="bg-secondary/50 rounded p-2">
                      <p className="text-muted-foreground">Audio</p>
                      <p className="font-mono text-foreground">{Math.round(metrics.audioLevel * 100)}%</p>
                    </div>
                    <div className="bg-secondary/50 rounded p-2">
                      <p className="text-muted-foreground">Light</p>
                      <p className="font-mono text-foreground">{Math.round(metrics.lightingScore)}</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
            
            <ChatSimulation />

            <Card className="bg-card p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Share Preview
              </h2>
              
              <Button
                onClick={generatePreviewLink}
                disabled={isGenerating || !stream}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isGenerating ? "Generating..." : "Generate Preview Link"}
              </Button>

              {previewUrl && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={previewUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground"
                    />
                    <Button
                      onClick={copyToClipboard}
                      variant="secondary"
                      size="icon"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this link with viewers to let them preview your stream
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorTest;
