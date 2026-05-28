import { useState } from "react";

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

  const submitDraft = () => {
    const text = draft.trim();
    if (!text) return false;

    setMessages((current) => [
      ...current,
      { role: "user", text },
      {
        role: "assistant",
        text: "Noted. Keep the next pass measurable: record, listen back, then adjust one variable only.",
      },
    ]);
    setDraft("");
    return true;
  };

  return {
    messages,
    draft,
    setDraft,
    submitDraft,
  };
}

