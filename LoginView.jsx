import { useState } from "react";
import { api } from "./api.js";

export function LoginView({ onLoggedIn, onGoRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { user } = await api.login(username, password);
      onLoggedIn(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <h1>ورود</h1>
      <span className="muted">به NightComic خوش برگشتی.</span>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="form-field">
          <label>نام کاربری</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
        </div>
        <div className="form-field">
          <label>رمز عبور</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn-primary" type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
          {busy ? "در حال ورود..." : "ورود"}
        </button>
      </form>
      <div className="auth-switch">
        حساب نداری؟ <button onClick={onGoRegister}>ثبت‌نام کن</button>
      </div>
    </div>
  );
}
