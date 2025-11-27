import { useState, useCallback } from "react";

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  isQuestion: boolean;
}

const sampleMessages = [
  "Great setup! Looking forward to the stream 🔥",
  "What time are you going live?",
  "Can you do a tutorial on lighting?",
  "Audio sounds perfect!",
  "Will this be recorded?",
  "Love your content!",
  "What camera are you using?",
  "Can't wait! 🎉",
  "How do you get such good quality?",
  "This is helpful, thanks!",
  "What microphone do you recommend?",
  "Where can I follow you?",
  "Stream schedule?",
  "Amazing quality!",
  "Can you show your setup?",
];

const sampleUsernames = [
  "StreamFan22",
  "TechGuru",
  "LiveLover",
  "ContentKing",
  "VideoMaster",
  "ChattyViewer",
  "StreamWatcher",
  "QualityCheck",
  "AudioGeek",
  "CreatorPro",
];

export const useChatSimulation = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const generateMessage = useCallback(() => {
    const message = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
    const username = sampleUsernames[Math.floor(Math.random() * sampleUsernames.length)];
    const isQuestion = message.includes("?");

    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      username,
      message,
      timestamp: new Date(),
      isQuestion,
    };

    setMessages((prev) => [...prev, newMessage].slice(-20)); // Keep last 20 messages
  }, []);

  const startSimulation = useCallback(() => {
    setIsSimulating(true);
    const interval = setInterval(() => {
      generateMessage();
    }, 2000 + Math.random() * 3000); // Random interval between 2-5 seconds

    return () => {
      clearInterval(interval);
      setIsSimulating(false);
    };
  }, [generateMessage]);

  const stopSimulation = useCallback(() => {
    setIsSimulating(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const addCustomMessage = useCallback((message: string) => {
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      username: "You",
      message,
      timestamp: new Date(),
      isQuestion: message.includes("?"),
    };
    setMessages((prev) => [...prev, newMessage].slice(-20));
  }, []);

  // Group similar questions
  const groupedQuestions = messages
    .filter((msg) => msg.isQuestion)
    .reduce((acc, msg) => {
      // Simple similarity check based on keywords
      const keywords = msg.message.toLowerCase().split(" ");
      const existingGroup = acc.find((group) =>
        group.messages.some((m) =>
          keywords.some((keyword) => m.message.toLowerCase().includes(keyword) && keyword.length > 3)
        )
      );

      if (existingGroup) {
        existingGroup.messages.push(msg);
      } else {
        acc.push({ messages: [msg], keyword: keywords.find((k) => k.length > 3) || "question" });
      }

      return acc;
    }, [] as Array<{ messages: ChatMessage[]; keyword: string }>);

  return {
    messages,
    isSimulating,
    startSimulation,
    stopSimulation,
    clearMessages,
    addCustomMessage,
    groupedQuestions,
  };
};
