import type { FormEvent } from "react";
import { ArrowRight, Plus, X } from "lucide-react";
import type { ProjectDraft } from "@/lib/continuity-engine";

interface ProjectSetupDialogProps {
  open: boolean;
  mode: "create" | "edit";
  draft: ProjectDraft;
  extractedSkills: string[];
  error: string;
  onDraftChange: (draft: ProjectDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

export default function ProjectSetupDialog({
  open,
  mode,
  draft,
  extractedSkills,
  error,
  onDraftChange,
  onSubmit,
  onClose,
}: ProjectSetupDialogProps) {
  if (!open) return null;
  const update = <K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) =>
    onDraftChange({ ...draft, [key]: value });

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <form className="detail-modal project-modal" role="dialog" aria-modal="true" aria-labelledby="new-project-title" onSubmit={onSubmit}>
        <header className="modal-header">
          <div><span className="eyebrow">PROJECT SETUP · LOCAL DEMO ONLY</span><h2 id="new-project-title">{mode === "edit" ? "Edit active project" : "Create a project"}</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close project form"><X size={18} /></button>
        </header>
        <p className="modal-intro">{mode === "edit" ? "Update this active project in the local demo. The matching and risk model recalculates from its fields." : "Add a project brief to this local demo. No employee or project records are sent or stored."}</p>
        <label className="field"><span>Project name</span><input required value={draft.name} onChange={event => update("name", event.target.value)} placeholder="e.g. Claims modernization" /></label>
        <label className="field"><span>Project description</span><textarea required rows={3} value={draft.description} onChange={event => update("description", event.target.value)} placeholder="Describe the outcome, domain and work involved…" /></label>
        <label className="field"><span>Required skills</span><input value={draft.skills} onChange={event => update("skills", event.target.value)} placeholder="Python, AWS, SQL (optional if found in description)" /></label>
        <p className="field-help">{draft.skills.trim() ? "Use commas to separate required skills." : extractedSkills.length ? `Recognized from description: ${extractedSkills.join(", ")}` : "Mention known skills such as Python, AWS, Cybersecurity, SQL or React in the description."}</p>
        <div className="form-two-col">
          <label className="field"><span>Minimum proficiency</span><select value={draft.proficiency} onChange={event => update("proficiency", event.target.value)}>{[70, 75, 80, 85, 90].map(value => <option key={value} value={value}>{value}%</option>)}</select></label>
          <label className="field"><span>Team size</span><select value={draft.teamSize} onChange={event => update("teamSize", event.target.value)}>{[2, 3, 4, 5, 6, 8].map(value => <option key={value} value={value}>{value} people</option>)}</select></label>
          <label className="field"><span>Deadline</span><select value={draft.deadline} onChange={event => update("deadline", event.target.value)}>{["2 weeks", "4 weeks", "8 weeks", "12 weeks", "16 weeks"].map(value => <option key={value}>{value}</option>)}</select></label>
          <label className="field"><span>Priority</span><select value={draft.priority} onChange={event => update("priority", event.target.value)}><option>High</option><option>Medium</option><option>Low</option></select></label>
          <label className="field"><span>Domain</span><select value={draft.domain} onChange={event => update("domain", event.target.value)}>{["Healthcare", "Fintech", "Retail", "Public sector", "Other"].map(value => <option key={value}>{value}</option>)}</select></label>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions"><button className="button button-quiet" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit"><Plus size={15} />{mode === "edit" ? "Save project changes" : "Activate in demo"} <ArrowRight size={14} /></button></div>
      </form>
    </div>
  );
}
