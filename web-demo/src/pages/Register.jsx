import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import DuckMark from "@/components/layout/DuckMark";

/**
 * @param {{ onGoToLogin: () => void }} props
 */
export default function Register({ onGoToLogin }) {
  const { register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /** @param {React.FormEvent<HTMLFormElement>} e */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must have at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
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

        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? "Creating account…" : "Register"}
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
