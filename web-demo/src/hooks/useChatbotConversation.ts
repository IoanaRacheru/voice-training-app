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
];

function buildChatContext(messages: ChatMessage[]) {
  const recentUserLines = messages
    .filter((message) => message.role === "user")
    .slice(-3)
    .map((message) => message.text.trim())
    .filter(Boolean);

  if (!recentUserLines.length) {
    return "";
  }

  return recentUserLines
    .map((line, index) => `Recent user intent ${index + 1}: ${line}`)
    .join("\n");
}


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
      const recentContext = buildChatContext([
        ...messages,
        { role: "user", text },
      ]);
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
