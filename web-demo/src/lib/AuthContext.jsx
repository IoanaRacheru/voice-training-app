import { createContext, useContext, useState } from "react";

/**
 * @typedef {{
 *   id: string;
 *   username: string;
 *   email?: string;
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
 *   login: (data: { id: string }) => void;
 *   register: (data?: { username?: string; email?: string }) => void;
 *   logout: () => void;
 *   updateUser: (updates: Partial<User>) => void;
 * }} AuthContextValue
 */

const AuthContext = createContext(/** @type {AuthContextValue | null} */ (null));

/**
 * Provides temporary frontend authentication state.
 *
 * This does not persist data in localStorage.
 * Later, login/register/logout/updateUser should be replaced with backend API calls.
 *
 * @param {{ children: React.ReactNode }} props
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(/** @type {User | null} */ (null));

  /**
   * Temporary login placeholder.
   * Later this should call the backend login endpoint.
   *
   * @param {{ id: string }} data
   */
  const login = ({ id }) => {
    if (!id) {
      throw new Error("Please provide a username or email.");
    }

    /** @type {User} */
    const demoUser = {
      id,
      username: id.includes("@") ? id.split("@")[0] : id,
      email: id.includes("@") ? id : "",
      voice_goal: "feminine",
      experience_level: "beginner",
      target_pitch_range: [180, 240],
      training_focus: ["pitch"],
    };

    setUser(demoUser);
  };

  /**
   * Temporary register placeholder.
   * Later this should call the backend register endpoint.
   *
   * @param {{ username?: string; email?: string }} data
   */
  const register = (data = {}) => {
    const id = data.email || data.username;

    if (!id) {
      throw new Error("Please provide a username or email.");
    }

    login({ id });
  };

  /**
   * Temporary logout placeholder.
   * Later this should call the backend logout endpoint.
   */
  const logout = () => {
    setUser(null);
  };

  /**
   * Updates user data only in React state.
   * Later this should call PATCH /me or PATCH /profile.
   *
   * @param {Partial<User>} updates
   */
  const updateUser = (updates) => {
    if (!user) return;

    setUser({
      ...user,
      ...updates,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userId: user?.id || null,
        isAuthenticated: Boolean(user),
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

/**
 * Access authentication state and actions.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
