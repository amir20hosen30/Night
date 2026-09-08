import { useState } from "react";
import { api } from "./api.js";

export function RegisterView({ onRegistered, onGoLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { user } = await api.register(username, password);
      onRegistered(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <h1>ساخت حساب کاربری</h1>
      <span className="muted">برای ذخیره‌ی لیستِ من، یه حساب بساز.</span>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="form-field">
          <label>نام کاربری</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
        </div>
        <div className="form-field">
          <label>رمز عبور (حداقل ۶ کاراکتر)</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        </div>
        <button className="btn-primary" type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
          {busy ? "در حال ساخت حساب..." : "ثبت‌نام"}
        </button>
      </form>
      <div className="auth-switch">
        حساب داری؟ <button onClick={onGoLogin}>وارد شو</button>
      </div>
    </div>
  );
}
