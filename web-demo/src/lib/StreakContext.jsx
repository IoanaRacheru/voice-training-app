import { createContext, useContext, useState } from "react";
import { streakService } from "./streakService";

const StreakContext = createContext();

export function StreakProvider({ children }) {
  const [state, setState] = useState(streakService.getState());

  const updateAfterSession = () => {
    const newState = streakService.updateAfterSession();
    setState({ ...newState });
  };

  return (
    <StreakContext.Provider value={{ state, updateAfterSession }}>
      {children}
    </StreakContext.Provider>
  );
}

export function useStreak() {
  return useContext(StreakContext);
}