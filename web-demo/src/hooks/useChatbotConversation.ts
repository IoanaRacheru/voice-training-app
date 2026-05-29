import { useState } from "react";
import { chat } from "@/api/authClient";

type ChatRole = "assistant" | "user";
type ChatMessage = {
  role: ChatRole;
  text: string;
};

const initialMessages: ChatMessage[] = [
  {
    role: "assistant",
    text: "Bring one clean sustained tone into focus. I will track what you report and keep the next exercise plain.",
  },
  {
    role: "user",
    text: "I want to keep the pitch steady without tensing up.",
  },
  {
    role: "assistant",
    text: "Work in 20 second passes. If the throat tightens, reset with breath before chasing pitch.",
  },
];

/**
 * Manages local chatbot transcript state and submit behavior.
 */
export function useChatbotConversation() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);

  const submitDraft = async () => {
    const text = draft.trim();
    if (!text) return false;

    setIsSending(true);
    setMessages((current) => [...current, { role: "user", text }]);
    setDraft("");
    try {
      const recentContext = messages.slice(-4).map((m) => `${m.role}: ${m.text}`).join("\n");
      const response = await chat({ message: text, context: recentContext });
      setMessages((current) => [...current, { role: "assistant", text: response.reply }]);
      setBackendAvailable(true);
      return true;
    } catch (_error) {
      setBackendAvailable(false);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "Backend coach is unavailable right now. Try again shortly.",
        },
      ]);
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return {
    messages,
    draft,
    setDraft,
    submitDraft,
    isSending,
    backendAvailable,
  };
}
