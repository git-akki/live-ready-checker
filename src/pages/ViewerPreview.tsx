import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

const ViewerPreview = () => {
  const { sessionId } = useParams<{ sessionId: string }>();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Live Preview</h1>
          <p className="text-muted-foreground">Session: {sessionId}</p>
        </div>

        <Card className="bg-card overflow-hidden">
          <div className="aspect-video bg-secondary flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Wifi className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold text-foreground">
                  Connecting to stream...
                </p>
                <p className="text-sm text-muted-foreground">
                  WebRTC connection in progress
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                <span>Network: Good</span>
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Preview mode • WebRTC
            </p>
          </div>
        </Card>

        <Card className="bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            About This Preview
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              This is a live preview of the creator's stream. The connection uses WebRTC
              for low-latency, peer-to-peer streaming.
            </p>
            <p>
              Network quality is monitored in real-time to ensure the best viewing experience.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ViewerPreview;
