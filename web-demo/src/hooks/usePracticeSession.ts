import { useEffect, useState } from "react";
import { practiceSessionService } from "@/services/practiceSessionService";

export function usePracticeSession() {
  const [state, setState] = useState(() => practiceSessionService.getState());

  useEffect(() => {
    const sync = () => setState(practiceSessionService.getState());
    window.addEventListener("voicePracticeSession:changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("voicePracticeSession:changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return {
    ...state,
    dismissReminder: () => setState(practiceSessionService.dismissReminder() as any),
  };
}
