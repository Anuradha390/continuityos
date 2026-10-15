import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Check, Copy, ShieldAlert, Sparkles, X } from "lucide-react";
import { DEMO_PROMPTS, getCopilotAnswer, type CopilotContext, type ScenarioMetrics } from "@/lib/continuity-engine";

interface CopilotDrawerProps {
  open: boolean;
  onClose: () => void;
  metrics: ScenarioMetrics;
  context: CopilotContext;
}

export default function CopilotDrawer({ open, onClose, metrics, context }: CopilotDrawerProps) {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState<ReturnType<typeof getCopilotAnswer> | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      setPrompt("");
      setAnswer(null);
      return;
    }

    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const drawer = drawerRef.current;
    const getFocusable = () => Array.from(drawer?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])') ?? []);
    const frame = window.requestAnimationFrame(() => (inputRef.current ?? getFocusable()[0] ?? drawer)?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = getFocusable();
      if (!items.length) { event.preventDefault(); drawer?.focus(); return; }
      if (event.shiftKey && (document.activeElement === items[0] || !drawer?.contains(document.activeElement))) {
        event.preventDefault();
        items[items.length - 1].focus();
      } else if (!event.shiftKey && (document.activeElement === items[items.length - 1] || !drawer?.contains(document.activeElement))) {
        event.preventDefault();
        items[0].focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      if (previous?.isConnected) previous.focus();
    };
  }, [open]);

  useEffect(() => {
    const handlePrompt = (event: Event) => {
      const question = (event as CustomEvent<string>).detail;
      if (!question) return;
      setPrompt(question);
      setAnswer(getCopilotAnswer(question, metrics, context));
    };
    window.addEventListener("continuity-copilot-prompt", handlePrompt);
    return () => window.removeEventListener("continuity-copilot-prompt", handlePrompt);
  }, [metrics, context]);

  if (!open) return null;
  const ask = (question: string) => {
    const cleaned = question.trim();
    if (!cleaned) return;
    setPrompt(cleaned);
    setAnswer(getCopilotAnswer(cleaned, metrics, context));
  };

  const copyBriefing = async () => {
    if (!answer) return;
    const text = `${answer.title}\n\nRisk: ${answer.risk}\nEvidence: ${answer.evidence}\nBusiness impact: ${answer.impact}\nRecommended action: ${answer.action}\nExpected improvement: ${answer.improvement}\nConfidence: ${answer.confidence}%`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <button className="drawer-scrim" onClick={onClose} aria-label="Close Copilot drawer" />
      <aside ref={drawerRef} className="copilot-drawer" role="dialog" aria-modal="true" aria-labelledby="copilot-title" tabIndex={-1}>
        <header className="copilot-header">
          <div className="copilot-brand-icon"><Bot size={19} /></div>
          <div className="copilot-heading"><h2 id="copilot-title">Continuity Copilot</h2><span><i className="online-dot" /> Seeded demo assistant</span></div>
          <button className="icon-button" onClick={onClose} aria-label="Close Copilot"><X size={18} /></button>
        </header>
        <div className="copilot-context"><ShieldAlert size={15} /><span>Answers use this project's seeded workforce evidence.</span></div>
        <div className="copilot-content" aria-live="polite">
          {!answer ? (
            <div className="copilot-welcome">
              <div className="sparkle-orbit"><Sparkles size={20} /></div>
              <h3>Stress-test your team.</h3>
              <p>Ask about a person, skill dependency or recovery plan. Every answer includes evidence and a next action.</p>
              <span className="suggested-label">SUGGESTED QUESTIONS</span>
              <div className="prompt-list">
                {DEMO_PROMPTS.map(item => <button key={item} className="prompt-chip" onClick={() => ask(item)}>{item}<span>↗</span></button>)}
              </div>
            </div>
          ) : (
            <article className="copilot-answer">
              <div className="answer-question"><span className="question-avatar">You</span><span>{prompt}</span></div>
              <div className="answer-title"><span className="answer-bot"><Bot size={15} /></span><div><small>CONTINUITY ANALYSIS</small><h3>{answer.title}</h3></div></div>
              <div className="answer-risk"><span>RISK</span><p>{answer.risk}</p></div>
              <div className="answer-section"><strong>Evidence</strong><p>{answer.evidence}</p></div>
              <div className="answer-section"><strong>Business impact</strong><p>{answer.impact}</p></div>
              <div className="answer-section action"><strong>Recommended action</strong><p>{answer.action}</p></div>
              <div className="answer-improvement"><strong>Expected improvement</strong><p>{answer.improvement}</p></div>
              <div className="confidence-row"><span>Confidence</span><div className="confidence-meter"><i style={{ width: `${answer.confidence}%` }} /></div><strong>{answer.confidence}%</strong></div>
              <button className="copy-brief" onClick={copyBriefing}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Briefing copied" : "Copy manager briefing"}</button>
            </article>
          )}
        </div>
        <form className="copilot-input" onSubmit={event => { event.preventDefault(); ask(prompt); }}>
          <input ref={inputRef} value={prompt} onChange={event => setPrompt(event.target.value)} placeholder="Ask about a project risk…" aria-label="Ask Continuity Copilot" />
          <button type="submit" aria-label="Send question" disabled={!prompt.trim()}><ArrowUp size={17} /></button>
        </form>
        <p className="copilot-disclaimer">Demo assistant · Evidence-backed answers from sample data</p>
      </aside>
    </>
  );
}
