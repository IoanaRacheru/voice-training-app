import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import DuckMark from "@/components/layout/DuckMark";

/**
 * @param {{ onGoToLogin: () => void }} props
 */
export default function Register({ onGoToLogin }) {
  const { register } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  /**
   * @param {React.FormEvent<HTMLFormElement>} e
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must have at least 6 characters.");
      return;
    }

      try {
        register({ username, email });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="brand-icon big">
          <DuckMark />
        </div>

        <h1>Create account</h1>
        <p>Set up your account before creating your voice profile.</p>

        {error && <div className="auth-error">{error}</div>}

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password min. 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="primary-btn" type="submit">
          Register
        </button>

        <p className="auth-switch">
          Already have an account?{" "}
          <button type="button" onClick={onGoToLogin}>
            Login
          </button>
        </p>
      </form>
    </div>
  );
}
