import { useMemo } from "react";
import { getUserContactEmail, getUserDisplayName } from "@/lib/userDisplay";

type UserLike = Record<string, unknown> | null | undefined;


export function useUserProfileDisplay(user: UserLike) {
  return useMemo(
    () => ({
      displayName: getUserDisplayName(user, { fallbackToEmail: false }),
      email: getUserContactEmail(user),
    }),
    [user]
  );
}
