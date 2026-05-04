import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import DuckMark from "@/components/layout/DuckMark";

/**
 * @param {{ onGoToRegister: () => void }} props
 */
export default function Login({ onGoToRegister }) {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  /**
   * @param {React.FormEvent<HTMLFormElement>} e
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    try {
      // TODO: Replace with backend login and use returned user id
      login({ id: email });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="brand-icon big">
          <DuckMark />
        </div>

        <h1>Welcome back</h1>
        <p>Login to continue your voice training practice.</p>

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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="primary-btn" type="submit">
          Login
        </button>

        <p className="auth-switch">
          Don&apos;t have an account?{" "}
          <button type="button" onClick={onGoToRegister}>
            Create one
          </button>
        </p>
      </form>
    </div>
  );
}
