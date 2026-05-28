import { FormEvent } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatbotConversation } from "@/hooks/useChatbotConversation";

export default function Chatbot() {
  const { messages, draft, setDraft, submitDraft } = useChatbotConversation();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitDraft();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="mb-3 font-mono text-[11px] uppercase text-muted-foreground">Coach channel</p>
        <h1 className="font-display text-5xl uppercase leading-[0.95] text-foreground md:text-7xl">Chatbot</h1>
        <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-muted-foreground">
          A clean text space for coaching notes and session reflection.
        </p>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-white shadow-[0_24px_70px_rgba(17,17,17,0.07)]"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-black uppercase text-foreground">Transcript</h2>
          <span className="font-mono text-[11px] uppercase text-muted-foreground">Sustained tone</span>
        </div>

        <div className="max-h-[56vh] min-h-[390px] space-y-4 overflow-y-auto p-5 md:p-7">
          {messages.map((message, index) => {
            const isUser = message.role === "user";

            return (
              <article
                key={`${message.role}-${index}`}
                className={`max-w-3xl border-l-2 px-4 py-3 ${
                  isUser ? "ml-auto border-foreground bg-background" : "mr-auto border-primary bg-white"
                }`}
              >
                <p className={`font-mono text-[11px] uppercase ${isUser ? "text-muted-foreground" : "text-primary"}`}>
                  {isUser ? "User" : "Assistant"}
                </p>
                <p className="mt-2 text-sm font-medium leading-6 text-foreground">{message.text}</p>
              </article>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 border-t border-border bg-background p-4 md:grid-cols-[1fr_auto]">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a training note or coaching question"
            aria-label="Message"
          />
          <Button type="submit" className="h-full min-h-11">
            <Send className="h-4 w-4" />
            Send
          </Button>
        </form>
      </motion.section>
    </div>
  );
}

