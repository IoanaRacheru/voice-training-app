import { createContext, useContext, useEffect, useState } from "react";
import * as authApi from "@/api/authClient";
import { account, ID } from "@/lib/appwrite";

/**
 * @typedef {{
 *   id: string;
 *   username: string;
 *   email: string;
 *   voice_goal?: "feminize" | "masculinize" | "feminine" | "masculine" | "androgynous" | "custom";
 *   experience_level?: "beginner" | "intermediate" | "advanced";
 *   target_pitch_range?: number[];
 *   training_focus?: string[];
 *   identity_background?: string;
 *   personalization_goals?: string[];
 *   age?: string | number;
 *   puberty_background?: string;
 *   initial_voice_sample?: {
 *     name: string;
 *     type?: string;
 *     size?: number;
 *     source?: "recording" | "upload";
 *     saved_at?: string;
 *   };
 * }} User
 *
 * @typedef {{
 *   user: User | null;
 *   userId: string | null;
 *   isAuthenticated: boolean;
 *   isLoading: boolean;
 *   login: (email: string, password: string) => Promise<void>;
 *   register: (email: string, password: string) => Promise<void>;
 *   logout: () => Promise<void>;
 *   updateUser: (updates: Partial<User>) => Promise<void>;
 * }} AuthContextValue
 */

const AuthContext = createContext(/** @type {AuthContextValue | null} */ (null));

/** @param {{ user_id: string, email: string, voice_goal?: string, experience_level?: string, target_pitch_range?: number[], training_focus?: string[] }} data */
function buildUser(data) {
  return {
    id: data.user_id,
    username: data.email.split("@")[0],
    email: data.email,
    voice_goal: data.voice_goal ?? "feminize",
    experience_level: data.experience_level ?? "beginner",
    target_pitch_range: data.target_pitch_range ?? [180, 240],
    training_focus: data.training_focus ?? ["pitch"],
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(/** @type {User | null} */ (null));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    account
      .get()
      .then(() => authApi.getMe())
      .then((data) => setUser(buildUser(data)))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  /** @param {string} email @param {string} password */
  const login = async (email, password) => {
    await account.createEmailPasswordSession(email, password);
    const data = await authApi.getMe();
    setUser(buildUser(data));
  };

  /** @param {string} email @param {string} password */
  const register = async (email, password) => {
    await account.create(ID.unique(), email, password);
    await login(email, password);
  };

  const logout = async () => {
    try {
      await account.deleteSession("current");
    } catch {}
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  /** @param {Partial<User>} updates */
  const updateUser = async (updates) => {
    if (!user) return;

    const { voice_goal, experience_level, target_pitch_range, training_focus } = updates;
    const patch = {};
    if (voice_goal !== undefined) patch.voice_goal = voice_goal;
    if (experience_level !== undefined) patch.experience_level = experience_level;
    if (target_pitch_range !== undefined) patch.target_pitch_range = target_pitch_range;
    if (training_focus !== undefined) patch.training_focus = training_focus;

    if (Object.keys(patch).length > 0) {
      await authApi.patchMe(patch);
    }
    setUser({ ...user, ...updates });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userId: user?.id ?? null,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
