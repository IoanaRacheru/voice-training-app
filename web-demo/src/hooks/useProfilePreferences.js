import { useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getSavedBackground, getSavedProfilePreferences } from "@/lib/profilePreferences";

export function useProfilePreferences() {
  const { user, updateUser } = useAuth();
  const preferences = useMemo(() => getSavedProfilePreferences(user), [user]);
  const background = useMemo(() => getSavedBackground(user), [user]);

  const saveProfilePreferences = async (updates) => {
    await updateUser?.(updates);
  };

  return {
    preferences,
    background,
    saveProfilePreferences,
  };
}
