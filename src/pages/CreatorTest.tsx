import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { VideoPreview } from "@/components/VideoPreview";
import { QualityIndicator } from "@/components/QualityIndicator";
import { useMediaStream } from "@/hooks/useMediaStream";
import { useQualityChecks } from "@/hooks/useQualityChecks";
import { Copy, Video, Mic, Wifi, Sun } from "lucide-react";

const CreatorTest = () => {
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { stream, error: streamError, startStream } = useMediaStream();
  const { audioLevel, lightingScore, networkQuality } = useQualityChecks(stream);

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

  const getAudioStatus = () => {
    if (audioLevel > 0.3) return { label: "Good", variant: "good" as const };
    if (audioLevel > 0.1) return { label: "Low", variant: "warning" as const };
    return { label: "Silent", variant: "error" as const };
  };

  const getLightingStatus = () => {
    if (lightingScore > 120) return { label: "Good", variant: "good" as const };
    if (lightingScore > 60) return { label: "Dim", variant: "warning" as const };
    return { label: "Dark", variant: "error" as const };
  };

  const getNetworkStatus = () => {
    if (networkQuality === "good") return { label: "Good", variant: "good" as const };
    if (networkQuality === "fair") return { label: "Fair", variant: "warning" as const };
    return { label: "Unstable", variant: "error" as const };
  };

  const audioStatus = getAudioStatus();
  const lightingStatus = getLightingStatus();
  const networkStatus = getNetworkStatus();

  const allGood = audioStatus.variant === "good" && 
                  lightingStatus.variant === "good" && 
                  networkStatus.variant === "good";

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
            
            {allGood && (
              <Card className="bg-card border-status-good/30 p-6 text-center">
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
                  label="Audio Level"
                  status={audioStatus.label}
                  variant={audioStatus.variant}
                />
                
                <QualityIndicator
                  icon={<Sun className="w-4 h-4" />}
                  label="Lighting"
                  status={lightingStatus.label}
                  variant={lightingStatus.variant}
                />
                
                <QualityIndicator
                  icon={<Wifi className="w-4 h-4" />}
                  label="Network"
                  status={networkStatus.label}
                  variant={networkStatus.variant}
                />
              </div>
            </Card>

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
