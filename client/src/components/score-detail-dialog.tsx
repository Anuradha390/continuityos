import { X } from "lucide-react";
import {
  CONTINUITY_WEIGHT_LABELS,
  type ContinuityFactors,
  type Employee,
  type Project,
  getEmployeeScoreBreakdown,
} from "@/lib/continuity-engine";

interface ScoreDetailDialogProps {
  open: boolean;
  onClose: () => void;
  factors: ContinuityFactors;
  readiness: number;
  deadlineFeasibility: number;
  employee?: Employee | null;
  project: Project;
  employees: Employee[];
  unavailableDuringDeadline: boolean;
}

export default function ScoreDetailDialog({ open, onClose, factors, readiness, deadlineFeasibility, employee, project, employees, unavailableDuringDeadline }: ScoreDetailDialogProps) {
  if (!open) return null;
  const employeeBreakdown = employee ? getEmployeeScoreBreakdown(employee, project, employees, unavailableDuringDeadline) : null;
  const title = employee ? `${employee.name} · employee fit score` : "Team continuity · score breakdown";

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="score-title">
        <header className="modal-header">
          <div>
            <span className="eyebrow">Explainable score</span>
            <h2 id="score-title">{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close score explanation"><X size={18} /></button>
        </header>
        {employeeBreakdown ? (
          <>
            <p className="modal-intro">The employee score combines six visible factors, then applies explicit overload and dependency penalties.</p>
            <div className="score-summary"><span>Current project fit</span><strong>{employeeBreakdown.score}<small>/100</small></strong>{employeeBreakdown.excluded && <span className="risk-pill critical"><span className="risk-dot" />Excluded in this scenario</span>}</div>
            <div className="score-factor-list">
              {employeeBreakdown.factors.map(factor => (
                <div className="score-factor" key={factor.label}>
                  <div className="score-factor-copy"><span>{factor.label}</span><small>{factor.weight}% weight</small></div>
                  <div className="factor-meter"><span style={{ width: `${factor.value}%` }} /></div>
                  <strong>{factor.value}</strong>
                </div>
              ))}
            </div>
            <div className="formula-box"><strong>Employee score formula</strong><p>35% skill match + 20% availability + 15% experience + 15% workload safety + 10% domain experience + 5% collaboration history.</p></div>
            {employeeBreakdown.penalties.length > 0 && <div className="penalty-list"><strong>Applied penalties</strong>{employeeBreakdown.penalties.map(item => <span key={item}>{item}</span>)}</div>}
            <p className="modal-footnote">A person unavailable during the project deadline is excluded from recommendations. This demo uses seeded, deterministic data—not an opaque AI score.</p>
          </>
        ) : (
          <>
            <p className="modal-intro">Continuity measures whether the project can keep moving when a critical person or skill is disrupted.</p>
            <section className="readiness-explainer" aria-label="Team readiness calculation">
              <div className="readiness-explainer-head"><span>Team readiness</span><strong>{readiness}<small>/100</small></strong></div>
              <p>Readiness = 80% continuity + 20% deadline feasibility. Continuity combines the five coverage, backup, workload, availability and knowledge factors below.</p>
              <div className="readiness-explainer-factors"><span><b>Skill coverage</b><strong>{factors.skillCoverage}%</strong></span><span><b>Backup coverage</b><strong>{factors.backupCoverage}%</strong></span><span><b>Workload safety</b><strong>{factors.workloadSafety}%</strong></span><span><b>Availability</b><strong>{factors.availability}%</strong></span><span><b>Knowledge distribution</b><strong>{factors.knowledgeDistribution}%</strong></span><span><b>Deadline feasibility</b><strong>{deadlineFeasibility}%</strong></span></div>
            </section>
            <div className="score-factor-list">
              {CONTINUITY_WEIGHT_LABELS.map(item => {
                const value = factors[item.key as keyof ContinuityFactors];
                return (
                  <div className="score-factor explained" key={item.key}>
                    <div className="score-factor-copy"><span>{item.label}</span><small>{item.weight}% weight · {item.formula}</small></div>
                    <div className="factor-meter"><span style={{ width: `${value}%` }} /></div>
                    <strong>{value}%</strong>
                  </div>
                );
              })}
            </div>
            <div className="formula-box"><strong>Team continuity score</strong><p>30% skill coverage + 20% backup coverage + 20% workload safety + 15% availability + 15% knowledge distribution.</p></div>
            <p className="modal-footnote">Backup coverage is critical skills with at least two capable employees divided by all critical skills. Scores are rounded to the nearest whole number.</p>
          </>
        )}
      </section>
    </div>
  );
}
