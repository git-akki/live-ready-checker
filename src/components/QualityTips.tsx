import { Card } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

interface QualityTipsProps {
  audioStatus: string;
  lightingStatus: string;
  networkStatus: string;
}

export const QualityTips = ({ audioStatus, lightingStatus, networkStatus }: QualityTipsProps) => {
  const tips: string[] = [];

  // Audio tips
  if (audioStatus === "Too Quiet") {
    tips.push("🎤 Speak closer to your microphone or increase input volume");
  } else if (audioStatus === "Too Loud") {
    tips.push("🔊 Lower your microphone volume to prevent audio distortion");
  } else if (audioStatus === "Background Noise") {
    tips.push("🔇 Reduce background noise or use a noise-canceling microphone");
  } else if (audioStatus === "No Mic") {
    tips.push("⚠️ No microphone detected. Check your device permissions");
  }

  // Lighting tips
  if (lightingStatus === "Too Dark") {
    tips.push("💡 Move closer to a light source or add more lighting");
  } else if (lightingStatus === "Overexposed") {
    tips.push("☀️ Reduce brightness or move away from direct light");
  } else if (lightingStatus === "Uneven Lighting") {
    tips.push("⚖️ Balance lighting on both sides of your face for better appearance");
  }

  // Network tips
  if (networkStatus === "Critical") {
    tips.push("🌐 Network is unstable. Switch to wired connection or move closer to router");
  } else if (networkStatus === "Unstable") {
    tips.push("📶 Consider closing bandwidth-heavy apps for better streaming");
  } else if (networkStatus === "Moderate") {
    tips.push("📡 Network is okay but could be better. Try WiFi over cellular data");
  }

  // All good message
  if (tips.length === 0) {
    return (
      <Card className="bg-status-good/10 border-status-good/30 p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-status-good mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-status-good">Perfect Setup!</h3>
            <p className="text-xs text-status-good/80">
              All quality checks passed. You're ready to go live!
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border p-4">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Quality Tips</h3>
          <ul className="space-y-1.5">
            {tips.map((tip, index) => (
              <li key={index} className="text-xs text-muted-foreground leading-relaxed">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
};
