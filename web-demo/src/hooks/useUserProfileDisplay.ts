import { useMemo } from "react";
import { getUserContactEmail, getUserDisplayName } from "@/lib/userDisplay";

type UserLike = Record<string, unknown> | null | undefined;

/**
 * Centralized display mapping for user name + contact email.
 */
export function useUserProfileDisplay(user: UserLike) {
  return useMemo(
    () => ({
      displayName: getUserDisplayName(user, { fallbackToEmail: false }),
      email: getUserContactEmail(user),
    }),
    [user]
  );
}
