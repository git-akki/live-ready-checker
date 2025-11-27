import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Play, Pause, Trash2, HelpCircle } from "lucide-react";
import { useChatSimulation } from "@/hooks/useChatSimulation";
import { formatDistanceToNow } from "date-fns";

export const ChatSimulation = () => {
  const {
    messages,
    isSimulating,
    startSimulation,
    stopSimulation,
    clearMessages,
    groupedQuestions,
  } = useChatSimulation();

  useEffect(() => {
    if (isSimulating) {
      const cleanup = startSimulation();
      return cleanup;
    }
  }, [isSimulating, startSimulation]);

  const topQuestions = groupedQuestions
    .filter((group) => group.messages.length > 1)
    .sort((a, b) => b.messages.length - a.messages.length)
    .slice(0, 3);

  return (
    <Card className="bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Chat Preview
        </h2>
        <div className="flex gap-2">
          <Button
            onClick={isSimulating ? stopSimulation : () => startSimulation()}
            variant="secondary"
            size="sm"
          >
            {isSimulating ? (
              <>
                <Pause className="w-3 h-3 mr-1" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-3 h-3 mr-1" />
                Start
              </>
            )}
          </Button>
          <Button onClick={clearMessages} variant="secondary" size="sm">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {topQuestions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            Frequently Asked ({topQuestions.length})
          </h3>
          {topQuestions.map((group, index) => (
            <div
              key={index}
              className="bg-secondary/50 border border-border rounded-md p-2 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-foreground flex-1">
                  {group.messages[0].message}
                </p>
                <span className="text-primary font-semibold text-[10px] bg-primary/10 px-1.5 py-0.5 rounded">
                  ×{group.messages.length}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ScrollArea className="h-[200px] w-full rounded-md border border-border bg-secondary/30 p-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No messages yet. Click Start to simulate chat!
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-0.5 animate-fade-in">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-primary">
                    {msg.username}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {msg.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <p className="text-[10px] text-muted-foreground text-center">
        Simulated chat to preview message flow and density
      </p>
    </Card>
  );
};
