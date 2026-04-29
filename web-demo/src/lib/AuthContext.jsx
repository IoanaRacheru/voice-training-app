import { createContext, useContext, useEffect, useState } from "react";

/**
 * @typedef {{
 *   id: string;
 *   username: string;
 *   full_name: string;
 *   email: string;
 *   password: string;
 * }} User
 *
 * @typedef {{
 *   user: User | null;
 *   isAuthenticated: boolean;
 *   login: (data: { email: string; password: string }) => void;
 *   register: (data: { username: string; email: string; password: string }) => void;
 *   logout: () => void;
 *   updateUser: (updatedUser: User) => void;
 * }} AuthContextValue
 */

const AuthContext = createContext(
  /** @type {AuthContextValue | null} */ (null)
);

/**
 * @param {{ children: React.ReactNode }} props
 */
export const AuthProvider = ({ children }) => {
const [user, setUser] = useState(
  /** @type {User | null} */ (null)
);

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const getUsers = () => {
    const savedUsers = localStorage.getItem("users");
    return savedUsers ? JSON.parse(savedUsers) : [];
  };

  /**
   * @param {{ username: string; email: string; password: string }} data
   */
  const register = ({ username, email, password }) => {
    /** @type {User[]} */
    const users = getUsers();

    const exists = users.some((u) => u.email === email);

    if (exists) {
      throw new Error("User already exists");
    }

    const newUser = {
      id: crypto.randomUUID(),
      username,
      full_name: username,
      email,
      password,
    };

    localStorage.setItem("users", JSON.stringify([...users, newUser]));
    localStorage.setItem("currentUser", JSON.stringify(newUser));

    setUser(newUser);
  };

  /**
   * @param {{ email: string; password: string }} data
   */
  const login = ({ email, password }) => {
    /** @type {User[]} */
    const users = getUsers();

    const found = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!found) {
      throw new Error("Invalid credentials");
    }

    localStorage.setItem("currentUser", JSON.stringify(found));
    setUser(found);
  };

  const logout = () => {
    localStorage.removeItem("currentUser");
    setUser(null);
  };
  /** @param {User} updatedUser */
  const updateUser = (updatedUser) => {
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));

    const users = JSON.parse(localStorage.getItem("users") || "[]");

    const updatedUsers = users.map((/** @type {User} */ item) =>
      item.email === updatedUser.email ? updatedUser : item
    );

    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
      user,
      isAuthenticated: Boolean(user),
      register,
      login,
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

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};