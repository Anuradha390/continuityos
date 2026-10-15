import { type FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Network, ShieldCheck } from "lucide-react";

export const DEMO_ACCESS_EMAIL = "manager@continuityos.demo";
export const DEMO_ACCESS_CODE = "demo123";

export default function DemoLogin({ onSignIn }: { onSignIn: (email: string, passcode: string) => boolean }) {
  const [email, setEmail] = useState(DEMO_ACCESS_EMAIL);
  const [passcode, setPasscode] = useState(DEMO_ACCESS_CODE);
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!onSignIn(email.trim(), passcode)) setError("That demo email or passcode does not match. Use the sample credentials shown below.");
  };

  return (
    <main className="demo-login-page">
      <div className="login-orbit login-orbit-one" aria-hidden="true" />
      <div className="login-orbit login-orbit-two" aria-hidden="true" />
      <section className="demo-login-card" aria-labelledby="login-title">
        <div className="login-brand-row">
          <span className="login-brand-mark" aria-hidden="true"><Network size={21} strokeWidth={1.7} /></span>
          <span className="login-brand-name">Continuity<span>OS</span></span>
          <span className="login-demo-pill">HACKATHON DEMO</span>
        </div>
        <div className="login-intro">
          <span className="login-eyebrow"><ShieldCheck size={15} /> WORKFORCE RESILIENCE WORKSPACE</span>
          <h1 id="login-title">Keep the work moving.</h1>
          <p>Sign in to explore how your workforce, skills, tasks and projects hold together under pressure.</p>
        </div>
        <form className="demo-login-form" onSubmit={submit}>
          <label className="login-field"><span>Manager email</span><input type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required /></label>
          <label className="login-field"><span>Demo passcode</span><span className="login-password-wrap"><input type={showPasscode ? "text" : "password"} autoComplete="current-password" value={passcode} onChange={event => setPasscode(event.target.value)} required /><button type="button" className="login-show-password" onClick={() => setShowPasscode(value => !value)} aria-label={showPasscode ? "Hide passcode" : "Show passcode"}>{showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="login-submit" type="submit"><LockKeyhole size={16} />Enter sample workspace<ArrowRight size={16} /></button>
        </form>
        <div className="login-credentials" aria-label="Sample login credentials"><span>JUDGE ACCESS · SAMPLE ONLY</span><div><code>{DEMO_ACCESS_EMAIL}</code><code>{DEMO_ACCESS_CODE}</code></div><small>These credentials open the seeded demo workspace.</small></div>
        <p className="login-disclaimer"><strong>Demo gate, not real security.</strong> This client-side sample login is for the hackathon presentation only. Do not enter real employee information.</p>
      </section>
      <footer className="login-footer"><span>CONTINUITYOS · BUILD TEAMS THAT CAN SURVIVE UNCERTAINTY</span><span>Seeded sample workforce · No real employee records</span></footer>
    </main>
  );
}
