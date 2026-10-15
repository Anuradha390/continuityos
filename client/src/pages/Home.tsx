import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck,
  BookOpen, CalendarDays, Check, ChevronDown, ChevronRight, CircleHelp, Clock3,
  Cloud, FileText, Gauge, GraduationCap, LayoutDashboard, LogOut, Menu, MessageSquareText, Pencil, Plus, Play,
  RotateCcw, Search, Share2, Shield, ShieldAlert, ShieldCheck, Sparkles, Users, X, Zap,
} from "lucide-react";
import CopilotDrawer from "@/components/copilot-drawer";
import DemoLogin, { DEMO_ACCESS_CODE, DEMO_ACCESS_EMAIL } from "@/components/demo-login";
import ProjectSetupDialog from "@/components/project-setup-dialog";
import ScoreDetailDialog from "@/components/score-detail-dialog";
import WorkforceTwin from "@/components/workforce-twin";
import {
  EMPLOYEES, PROJECT,
  createProjectFromDraft, extractProjectSkills, getEmployee,
  getProjectedProficiency, getRecommendedTeam as calculateRecommendedTeam, getScenarioLabel, getSuggestedCourse,
  getScenarioMetrics as calculateScenarioMetrics, getSkillInventory as calculateSkillInventory,
  getSuggestedBackup, getTeamMetrics as calculateTeamMetrics, getWorkloadPlan, projectToDraft, scoreEmployee as calculateEmployeeScore, updateProjectFromDraft,
  type Employee, type Project, type ProjectDraft, type RecoveryStrategy, type ScenarioInput, type ScenarioMetrics, type ScenarioType,
} from "@/lib/continuity-engine";
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Page = "overview" | "twin" | "scenario" | "people" | "skills" | "knowledge" | "project";

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard; count?: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "twin", label: "Workforce twin", icon: Share2 },
  { id: "project", label: "Team builder", icon: Users },
  { id: "scenario", label: "Scenario lab", icon: Activity, count: "01" },
  { id: "skills", label: "Skill resilience", icon: Shield },
  { id: "knowledge", label: "Knowledge transfer", icon: BookOpen },
  { id: "people", label: "People", icon: Users },
];

const typeOptions: { id: ScenarioType; label: string }[] = [
  { id: "absence", label: "Temporary absence" },
  { id: "resignation", label: "Resignation" },
  { id: "workload", label: "Workload increase" },
  { id: "deadline", label: "Urgent deadline" },
  { id: "new-project", label: "New project arrives" },
  { id: "unavailable", label: "Employee unavailable" },
];

function demoScenarioFor(project: Project): ScenarioInput {
  const requirement = project.requirements.find(item => item.skill.toLowerCase() === "cybersecurity")
    ?? project.requirements.find(item => item.critical)
    ?? project.requirements[0];
  return { type: "absence", employeeId: requirement?.ownerId ?? project.teamIds[0] ?? "rahul", days: 14 };
}

function formatDelay(days: number): string {
  if (days <= 0) return "0 days";
  if (days <= 2) return "0–2 days";
  if (days >= 14) return `${Math.round(days / 7)} weeks`;
  return `${days} days`;
}

function classForRisk(risk: string) {
  return risk.toLowerCase() === "critical" ? "critical" : risk.toLowerCase() === "medium" ? "medium" : "safe";
}

function Avatar({ employee, small = false }: { employee: Employee; small?: boolean }) {
  return <span className={`avatar ${small ? "avatar-small" : ""} avatar-${employee.id}`} aria-label={employee.name}>{employee.initials}</span>;
}

function Meter({ value, tone = "cyan" }: { value: number; tone?: "cyan" | "amber" | "red" | "green" }) {
  return <span className={`meter meter-${tone}`}><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></span>;
}

function MetricCard({
  label, value, suffix = "", detail, icon: Icon, trend, tone = "default", onClick,
}: {
  label: string; value: string | number; suffix?: string; detail: string; icon: typeof Gauge;
  trend?: string; tone?: string; onClick?: () => void;
}) {
  const Content = (
    <>
      <div className="metric-top"><span className={`metric-icon metric-icon-${tone}`}><Icon size={17} /></span>{trend && <span className="metric-trend"><ArrowUpRight size={12} />{trend}</span>}</div>
      <div className="metric-value">{value}<small>{suffix}</small></div>
      <div className="metric-label">{label}</div>
      <div className="metric-detail">{detail}</div>
      {onClick && <span className="metric-more">View breakdown <ChevronRight size={12} /></span>}
    </>
  );
  return onClick
    ? <button className="metric-card metric-interactive" onClick={onClick} aria-label={`${label}: ${value}${suffix}. ${detail}. View breakdown.`}>{Content}</button>
    : <article className="metric-card">{Content}</article>;
}

function ScoreRing({ value, label, onClick }: { value: number; label: string; onClick: () => void }) {
  return (
    <button className="score-ring-button" onClick={onClick} aria-label={`Explain ${label}, ${value} percent`}>
      <span className="score-ring" style={{ background: `conic-gradient(var(--cyan) ${value * 3.6}deg, rgba(255,255,255,.1) 0deg)` }}>
        <span className="score-ring-inner"><strong>{value}</strong><small>/100</small></span>
      </span>
      <span className="score-ring-label">{label}<small>Click to explain</small></span>
    </button>
  );
}

function ScoreBars({ factors, onClick }: { factors: ReturnType<typeof calculateScenarioMetrics>["factors"]; onClick: () => void }) {
  const rows = [
    ["Skill coverage", factors.skillCoverage],
    ["Backup coverage", factors.backupCoverage],
    ["Workload safety", factors.workloadSafety],
    ["Availability", factors.availability],
    ["Knowledge shared", factors.knowledgeDistribution],
  ] as const;
  return (
    <button className="score-bars" onClick={onClick} aria-label="Open continuity score components">
      {rows.map(([label, value]) => <span className="score-bar-row" key={label}><span>{label}</span><Meter value={value} tone={value < 35 ? "red" : value < 60 ? "amber" : "cyan"} /><strong>{value}%</strong></span>)}
    </button>
  );
}

function SectionTitle({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="section-title"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}

function Dashboard({ onSignOut }: { onSignOut: () => void }) {
  const [activeProject, setActiveProject] = useState<Project>(PROJECT);
  const [page, setPage] = useState<Page>("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scenarioType, setScenarioType] = useState<ScenarioType>("absence");
  const [employeeId, setEmployeeId] = useState(demoScenarioFor(PROJECT).employeeId);
  const [days, setDays] = useState(14);
  const [scenario, setScenario] = useState<ScenarioInput | null>(null);
  const [recoveryApplied, setRecoveryApplied] = useState(false);
  const [recoveryStrategy, setRecoveryStrategy] = useState<RecoveryStrategy>("cross-train");
  const [scoreOpen, setScoreOpen] = useState(false);
  const [scoreFactors, setScoreFactors] = useState(calculateScenarioMetrics(null, false, "cross-train", activeProject, EMPLOYEES).factors);
  const [scoreReadiness, setScoreReadiness] = useState(calculateScenarioMetrics(null, false, "cross-train", activeProject, EMPLOYEES).readiness);
  const [scoreDeadlineFeasibility, setScoreDeadlineFeasibility] = useState(calculateScenarioMetrics(null, false, "cross-train", activeProject, EMPLOYEES).deadlineFeasibility);
  const [scoreEmployee, setScoreEmployee] = useState<Employee | null>(null);
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);
  const [detailSkill, setDetailSkill] = useState<string | null>(null);
  const [projectModal, setProjectModal] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState<"create" | "edit">("create");
  const [projectSaved, setProjectSaved] = useState(false);
  const [projectFormError, setProjectFormError] = useState("");
  const [newProject, setNewProject] = useState<ProjectDraft>({ name: "", description: "", skills: "", proficiency: "80", teamSize: "4", deadline: "8 weeks", priority: "High", domain: "Healthcare" });
  const [sessionsScheduled, setSessionsScheduled] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [skillView, setSkillView] = useState<"list" | "graph">("list");
  const [showMobileNav, setShowMobileNav] = useState(false);
  const extractedSkills = extractProjectSkills(newProject.description, EMPLOYEES);

  useEffect(() => {
    if (!scoreOpen && !detailEmployee && !detailSkill && !projectModal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setScoreOpen(false);
      setScoreEmployee(null);
      setDetailEmployee(null);
      setDetailSkill(null);
      setProjectModal(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [scoreOpen, detailEmployee, detailSkill, projectModal]);

  useEffect(() => {
    if (!scoreOpen && !detailEmployee && !detailSkill && !projectModal) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]'));
    const dialog = dialogs[dialogs.length - 1];
    if (!dialog) return;
    const getFocusable = () => Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'));
    const frame = window.requestAnimationFrame(() => (getFocusable()[0] ?? dialog).focus());
    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = getFocusable();
      if (!items.length) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items[items.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === items[items.length - 1]) { event.preventDefault(); items[0].focus(); }
    };
    document.addEventListener("keydown", trapTab);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", trapTab);
      previous?.focus();
    };
  }, [scoreOpen, detailEmployee, detailSkill, projectModal]);

  const scenarioMetrics = (input: ScenarioInput | null, applied = false, strategy: RecoveryStrategy = "cross-train") => calculateScenarioMetrics(input, applied, strategy, activeProject, EMPLOYEES);
  const skillInventoryForProject = (applied = false, recoverySkill?: string) => calculateSkillInventory(applied, activeProject, EMPLOYEES, recoverySkill);
  const copilotContext = useMemo(() => ({ project: activeProject, employees: EMPLOYEES, scenario, recoveryApplied, recoveryStrategy }), [activeProject, scenario, recoveryApplied, recoveryStrategy]);
  const metrics = useMemo(() => scenarioMetrics(scenario, recoveryApplied, recoveryStrategy), [scenario, recoveryApplied, recoveryStrategy, activeProject]);
  const impactMetrics = useMemo(() => scenarioMetrics(scenario, false), [scenario, activeProject]);
  const proposedRecoveryMetrics = useMemo(() => scenarioMetrics(scenario ?? demoScenarioFor(activeProject), true, recoveryStrategy), [scenario, recoveryStrategy, activeProject]);
  const teamMetrics = calculateTeamMetrics(activeProject, EMPLOYEES);
  const baselineSkillInventory = skillInventoryForProject(false);
  const criticalDependencies = baselineSkillInventory.filter(item => item.critical && item.capableCount === 1);
  const criticalDependencyCount = criticalDependencies.length;
  const recommendedTeam = calculateRecommendedTeam(activeProject, EMPLOYEES);
  const currentDemoScenario = demoScenarioFor(activeProject);
  const selectedOwnerDependency = scenario && ["absence", "resignation", "unavailable"].includes(scenario.type) ? criticalDependencies.find(item => item.owner.id === scenario.employeeId) : undefined;
  const primaryDependency = selectedOwnerDependency ?? criticalDependencies.find(item => item.skill.toLowerCase() === "cybersecurity") ?? criticalDependencies[0] ?? baselineSkillInventory[0];
  const primaryOwner = primaryDependency?.owner ?? recommendedTeam[0] ?? EMPLOYEES[0];
  const primaryBackup = getSuggestedBackup(activeProject, primaryDependency?.skill ?? "", primaryOwner.id, EMPLOYEES);
  const recoverySkillName = primaryDependency?.skill ?? activeProject.requirements[0]?.skill ?? "critical skill";
  const skillInventory = skillInventoryForProject(recoveryApplied && recoveryStrategy === "cross-train", recoverySkillName);
  const recoverySkillInventory = skillInventoryForProject(true, recoverySkillName);
  const recoverySkillRequirement = activeProject.requirements.find(requirement => requirement.skill === recoverySkillName);
  const suggestedCourse = getSuggestedCourse(recoverySkillName);
  const projectedBackupProficiency = primaryBackup ? getProjectedProficiency(primaryBackup, recoverySkillName) : 0;
  const expectedBackupReadiness = primaryBackup && projectedBackupProficiency >= (recoverySkillRequirement?.minimum ?? 80)
    ? `${projectedBackupProficiency}% · meets ≥${recoverySkillRequirement?.minimum ?? 80}%`
    : `Target ≥${recoverySkillRequirement?.minimum ?? 80}% after verification`;
  const recoverySkillRecord = recoverySkillInventory.find(item => item.skill === recoverySkillName);
  const recoveryBackupReady = (recoverySkillRecord?.capableCount ?? 1) > 1;
  const knowledgeSteps = recoverySkillName.toLowerCase() === "cybersecurity" ? [
    { week: "Week 1 · Session 1", title: `${recoverySkillName} architecture walkthrough`, owner: `${primaryOwner.name} → ${primaryBackup?.name ?? "Learner"}`, status: "Ready to schedule" },
    { week: "Week 1 · Session 2", title: `Threat-model the ${activeProject.client} data flow`, owner: `${primaryOwner.name} → ${primaryBackup?.name ?? "Learner"}`, status: "Ready to schedule" },
    { week: "Week 2 · Session 3", title: "Practical security code review", owner: `${primaryOwner.name} → ${primaryBackup?.name ?? "Learner"}`, status: "Ready to schedule" },
    { week: "Week 2 · Session 4", title: `${primaryBackup?.name ?? "Learner"} completes and verifies a security task`, owner: `${primaryBackup?.name ?? "Learner"} · ${primaryOwner.name} reviews`, status: "Verification gate" },
  ] : [
    { week: "Week 1 · Session 1", title: `${recoverySkillName} architecture walkthrough`, owner: `${primaryOwner.name} → ${primaryBackup?.name ?? "Learner"}`, status: "Ready to schedule" },
    { week: "Week 1 · Session 2", title: `Review ${activeProject.client} dependencies and failure modes`, owner: `${primaryOwner.name} → ${primaryBackup?.name ?? "Learner"}`, status: "Ready to schedule" },
    { week: "Week 2 · Session 3", title: `Supervised ${recoverySkillName} work review`, owner: `${primaryOwner.name} → ${primaryBackup?.name ?? "Learner"}`, status: "Ready to schedule" },
    { week: "Week 2 · Session 4", title: `Complete and verify a ${recoverySkillName} task`, owner: `${primaryBackup?.name ?? "Learner"} · ${primaryOwner.name} reviews`, status: "Verification gate" },
  ];
  const projectBaseline = scenarioMetrics(null);
  const demoBaseline = scenarioMetrics(currentDemoScenario, false);
  const recoveryPreview = scenarioMetrics(currentDemoScenario, true, recoveryStrategy);
  const redistributionPreview = scenarioMetrics(scenario ?? currentDemoScenario, true, "redistribute");
  const remainingSingleOwnerSkills = (recoveryStrategy === "cross-train" ? recoverySkillInventory : baselineSkillInventory).filter(item => item.critical && item.capableCount === 1);
  const remainingRiskDescription = remainingSingleOwnerSkills.length ? `${remainingSingleOwnerSkills.map(item => item.skill).join(", ")} still need a verified second expert.` : "All critical skills have two qualified people in this hypothetical plan.";
  const skillCoverageCount = activeProject.requirements.filter(requirement => recommendedTeam.some(person => (person.skills[requirement.skill] ?? 0) >= requirement.minimum)).length;
  const suggestedTeamMembers = [...recommendedTeam, ...(primaryBackup ? [primaryBackup] : []), ...EMPLOYEES.filter(person => person.workload > 85 && !recommendedTeam.some(member => member.id === person.id))].filter((person, index, items) => items.findIndex(candidate => candidate.id === person.id) === index);
  const workloadPlan = getWorkloadPlan(scenario ?? currentDemoScenario, true, recoveryStrategy, activeProject, EMPLOYEES);
  const workloadChartData = workloadPlan.map(row => ({
    name: row.employee.name.split(" ")[0],
    Current: row.current,
    Proposed: row.proposed,
  }));
  const impactedEmployee = getEmployee(scenario?.employeeId ?? currentDemoScenario.employeeId, EMPLOYEES);
  const disruptionLabel = !scenario ? `${impactedEmployee.name.split(" ")[0]} · selected` : scenario.type === "deadline" ? "Urgent deadline" : scenario.type === "new-project" ? "New project arrives" : `${impactedEmployee.name.split(" ")[0]} · ${getScenarioLabel(scenario.type)}`;
  const timelineImpactDay = scenario?.type === "resignation" ? Math.max(14, scenario.days) : scenario?.days ?? days;
  const canApplyRecovery = Boolean(scenario && activeProject.requirements.some(requirement => requirement.critical && requirement.ownerId === scenario.employeeId) && ["absence", "resignation", "unavailable"].includes(scenario.type));
  const scenarioHasUnavailableEmployee = Boolean(scenario && ["absence", "resignation", "unavailable"].includes(scenario.type));
  const beforeComparison = scenario ? impactMetrics : projectBaseline;
  const afterComparison = scenario ? proposedRecoveryMetrics : recoveryPreview;
  const activeTitle = navItems.find(item => item.id === page)?.label ?? "Overview";

  const runSimulation = () => {
    setScenario({ type: scenarioType, employeeId, days });
    setRecoveryApplied(false);
    setRecoveryStrategy("cross-train");
    setPage("scenario");
  };
  const resetSimulation = () => {
    setScenario(null);
    setRecoveryApplied(false);
    setRecoveryStrategy("cross-train");
    setScenarioType("absence");
    setEmployeeId(currentDemoScenario.employeeId);
    setDays(14);
  };
  const loadJudgeDemo = (applyRecovery: boolean) => {
    setActiveProject(PROJECT);
    setProjectSaved(false);
    setScenario(demoScenarioFor(PROJECT));
    setRecoveryApplied(applyRecovery);
    setRecoveryStrategy("cross-train");
    setScenarioType("absence");
    setEmployeeId(demoScenarioFor(PROJECT).employeeId);
    setDays(14);
    setSessionsScheduled(false);
    setPage("scenario");
    setShowMobileNav(false);
  };
  const startJudgeDemo = () => loadJudgeDemo(true);
  const simulateDemoImpact = () => loadJudgeDemo(false);
  const selectPage = (next: Page) => {
    setPage(next);
    setShowMobileNav(false);
  };
  const showContinuityDetails = () => { setScoreFactors(metrics.factors); setScoreReadiness(metrics.readiness); setScoreDeadlineFeasibility(metrics.deadlineFeasibility); setScoreEmployee(null); setScoreOpen(true); };
  const showScoreFactors = (selected: ScenarioMetrics) => { setScoreFactors(selected.factors); setScoreReadiness(selected.readiness); setScoreDeadlineFeasibility(selected.deadlineFeasibility); setScoreEmployee(null); setScoreOpen(true); };
  const showEmployeeScore = (employee: Employee) => { setDetailEmployee(null); setScoreEmployee(employee); setScoreOpen(true); };
  const openCopilot = (prompt?: string) => {
    setDrawerOpen(true);
    if (prompt) window.setTimeout(() => window.dispatchEvent(new CustomEvent("continuity-copilot-prompt", { detail: prompt })), 100);
  };
  const openNewProject = () => {
    setProjectModalMode("create");
    setNewProject({ name: "", description: "", skills: "", proficiency: "80", teamSize: "4", deadline: "8 weeks", priority: "High", domain: "Healthcare" });
    setProjectFormError("");
    setProjectModal(true);
  };
  const editActiveProject = () => {
    setProjectModalMode("edit");
    setNewProject(projectToDraft(activeProject));
    setProjectFormError("");
    setProjectModal(true);
  };
  const submitProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newProject.name.trim()) {
      setProjectFormError("Enter a project name.");
      return;
    }
    const nextProject = projectModalMode === "edit"
      ? updateProjectFromDraft(newProject, activeProject, EMPLOYEES)
      : createProjectFromDraft(newProject, EMPLOYEES);
    if (!nextProject.requirements.length) {
      setProjectFormError("No known required skills were found. Add skills or mention Python, AWS, Cybersecurity, SQL or React in the description.");
      return;
    }
    setActiveProject(nextProject);
    setScenario(null);
    setRecoveryApplied(false);
    setRecoveryStrategy("cross-train");
    setScenarioType("absence");
    setEmployeeId(demoScenarioFor(nextProject).employeeId);
    setSessionsScheduled(false);
    setProjectFormError("");
    setProjectSaved(current => projectModalMode === "create" ? true : current);
    setProjectModal(false);
    setPage("project");
  };

  const renderOverview = () => (
    <>
      <section className="demo-onboarding" aria-label="Three-step hackathon demo guide">
        <div className="demo-onboarding-title"><span className="eyebrow">3-STEP JUDGE FLOW</span><strong>Inspect risk <ArrowRight size={13} /> Simulate a 14-day absence <ArrowRight size={13} /> Compare recovery</strong></div>
        <p>Use <b>Start judge demo</b> to run the seeded story again. Every change stays hypothetical and can be undone.</p>
      </section>
      <div className="overview-alert" role="status">
        <span className="alert-mark"><ShieldAlert size={17} /></span>
        <div><strong>{criticalDependencyCount} critical single-person dependencies detected</strong><p>{primaryOwner.name} is the only {primaryDependency?.skill ?? "critical skill"} expert on {activeProject.client}; {Math.max(0, criticalDependencyCount - 1)} other critical {Math.max(0, criticalDependencyCount - 1) === 1 ? "skill lacks" : "skills lack"} a second expert.</p></div>
        <button onClick={simulateDemoImpact}>Simulate impact <ArrowRight size={15} /></button>
      </div>

      <div className="metric-grid">
        <MetricCard label="Workforce" value={EMPLOYEES.length} detail={`Across ${new Set(EMPLOYEES.map(person => person.department)).size} departments`} icon={Users} tone="cyan" />
        <MetricCard label="Active projects" value={projectSaved ? 3 : 2} detail="1 project needs attention" icon={FileText} tone="violet" />
        <MetricCard label="Avg. utilization" value={teamMetrics.utilization} suffix="%" detail={`${teamMetrics.overloadedCount} employee${teamMetrics.overloadedCount === 1 ? "" : "s"} above safe capacity`} icon={Activity} tone="amber" />
        <MetricCard label="Continuity score" value={metrics.continuity} suffix="%" detail={`Across ${activeProject.client} · explainable score`} icon={ShieldCheck} tone={metrics.risk === "Critical" ? "red" : "cyan"} onClick={showContinuityDetails} />
      </div>

      <div className="workforce-indicators" aria-label="Workforce capacity indicators"><div><span>Available</span><strong>{teamMetrics.availableCount}</strong><small>employees · ≥50% capacity</small></div><div><span>Overloaded</span><strong className={teamMetrics.overloadedCount ? "text-critical" : ""}>{teamMetrics.overloadedCount}</strong><small>employees · above 85% workload</small></div><div><span>Underutilized</span><strong>{teamMetrics.underutilizedCount}</strong><small>employees · below 40% workload</small></div><div><span>Critical skill gaps</span><strong className="text-critical">{criticalDependencyCount}</strong><small>skills without a verified backup</small></div><div><span>At-risk teams</span><strong className={criticalDependencyCount ? "text-critical" : ""}>{criticalDependencyCount ? 1 : 0}</strong><small>active projects to stress-test</small></div></div>

      <div className="dashboard-main-grid">
        <section className="panel break-panel">
          <div className="panel-heading"><div><span className="eyebrow">FIRST FAILURE POINT</span><h2>What breaks first?</h2></div><span className={`risk-pill ${classForRisk(demoBaseline.risk)}`}><span className="risk-dot" />{demoBaseline.risk}</span></div>
          <button className="failure-card" onClick={() => setDetailSkill(primaryDependency?.skill ?? activeProject.requirements[0]?.skill ?? "")} aria-label={`Open ${primaryDependency?.skill ?? "critical skill"} dependency details`}>
            <span className="failure-icon"><ShieldAlert size={21} /></span>
            <span className="failure-copy"><small>CRITICAL SKILL</small><strong>{primaryDependency?.skill ?? "No critical skill"}</strong><span>{primaryDependency?.skill ?? "Required skill"} work is blocked if the owner is away</span></span>
            <ChevronRight size={17} />
          </button>
          <div className="failure-facts">
            <div><span>Owner</span><button className="owner-link" onClick={() => setDetailEmployee(primaryOwner)}><Avatar employee={primaryOwner} small />{primaryOwner.name}</button></div>
            <div><span>Backup coverage</span><strong className={primaryDependency?.capableCount === 1 ? "text-critical" : ""}>{Math.min(100, Math.max(0, ((primaryDependency?.capableCount ?? 1) - 1) * 100))}% <small>· {primaryDependency?.capableCount > 1 ? "Shared expertise" : "No verified backup"}</small></strong></div>
            <div><span>Estimated delay</span><strong>{formatDelay(demoBaseline.expectedDelayDays)}</strong></div>
            <div><span>Recovery cost</span><strong>{primaryBackup ? "4 sessions · 2 weeks" : "Backup plan needed"}</strong></div>
          </div>
          <div className="panel-footer"><span><span className="status-dot critical-dot" />Recovery action available</span><button className="text-button" onClick={() => selectPage("knowledge")}>View recovery plan <ArrowRight size={14} /></button></div>
        </section>

        <section className="panel readiness-panel">
          <div className="panel-heading"><div><span className="eyebrow">TEAM HEALTH</span><h2>Resilience at a glance</h2></div><button className="icon-button subtle" onClick={showContinuityDetails} aria-label="Explain continuity score"><CircleHelp size={17} /></button></div>
          <div className="readiness-layout"><ScoreRing value={metrics.continuity} label="Continuity" onClick={showContinuityDetails} /><div className="readiness-stat"><span>Team readiness</span><button className="readiness-score" onClick={showContinuityDetails} aria-label={`Explain team readiness ${metrics.readiness} out of 100`}>{metrics.readiness}<small>/100</small></button><em className={classForRisk(metrics.risk)}>{scenario ? metrics.risk + " scenario" : metrics.risk + " · baseline"}</em></div></div>
          <ScoreBars factors={metrics.factors} onClick={showContinuityDetails} />
          <button className="panel-link" onClick={showContinuityDetails}>See how the score is calculated <ArrowRight size={14} /></button>
        </section>
      </div>

      <div className="dashboard-secondary-grid">
        <section className="panel skills-panel">
          <div className="panel-heading"><div><span className="eyebrow">KNOWLEDGE CONCENTRATION</span><h2>Bus-factor map</h2></div><button className="text-button" onClick={() => selectPage("skills")}>View all <ArrowRight size={14} /></button></div>
          <div className="skill-list" role="list" aria-label="Project skill coverage">
            {skillInventory.slice(0, 5).map(item => (
              <button className="skill-row" key={item.skill} onClick={() => setDetailSkill(item.skill)} role="listitem">
                <span className="skill-name"><span className={`skill-glyph skill-${item.skill.toLowerCase()}`}>{item.skill.slice(0, 1)}</span><span><strong>{item.skill}</strong><small>{item.capableCount} capable {item.capableCount === 1 ? "employee" : "employees"}</small></span></span>
                <span className="skill-owner">{item.owner.name.split(" ")[0]}</span>
                <span className={`risk-pill ${classForRisk(item.risk)}`}><span className="risk-dot" />{item.risk}</span>
              </button>
            ))}
          </div>
          <div className="panel-footer"><span className="muted-note">Critical label = only one verified expert</span><button className="text-button" onClick={() => selectPage("skills")}>Explore dependencies <ArrowRight size={14} /></button></div>
        </section>

        <section className="panel team-panel">
          <div className="panel-heading"><div><span className="eyebrow">RESILIENT TEAM BUILDER</span><h2>Recommended team</h2></div><span className="team-ready"><Check size={13} />{skillCoverageCount} of {activeProject.requirements.length} skills covered</span></div>
          <div className="team-people">
            {recommendedTeam.map(person => {
              const best = Object.entries(person.skills).sort((a, b) => b[1] - a[1])[0];
              return <button className="team-person" key={person.id} onClick={() => setDetailEmployee(person)}><Avatar employee={person} /><span className="team-person-copy"><strong>{person.name}</strong><small>{best[0]} specialist · {best[1]}% proficiency</small></span><span className={`workload-tag ${person.workload > 85 ? "critical" : person.workload > 65 ? "medium" : "safe"}`}>{person.workload}% load</span></button>;
            })}
          </div>
          <div className="team-footer"><span className="team-score">{projectBaseline.factors.skillCoverage}% <small>skill match</small></span><span className="team-score caution">{projectBaseline.continuity}% <small>continuity</small></span><button className="text-button" onClick={() => selectPage("project")}>Why this team? <ArrowRight size={14} /></button></div>
        </section>
      </div>

      <section className="recovery-strip">
        <div className="recovery-strip-icon"><Zap size={18} /></div>
        <div className="recovery-strip-copy"><span className="eyebrow">BEFORE → AFTER RECOVERY</span><strong>Turn a single point of failure into a practiced backup.</strong><small>See a 14-day disruption, then compare the same project with a verified handover plan.</small></div>
        <div className="recovery-preview-metrics"><span><small>Continuity</small><strong>{demoBaseline.continuity}% <i>→</i> {recoveryPreview.continuity}%</strong></span><span><small>Backup coverage</small><strong>{demoBaseline.factors.backupCoverage}% <i>→</i> {recoveryPreview.factors.backupCoverage}%</strong></span><span><small>Expected delay</small><strong>{formatDelay(demoBaseline.expectedDelayDays)} <i>→</i> {formatDelay(recoveryPreview.expectedDelayDays)}</strong></span></div>
        <button className="button button-primary" onClick={simulateDemoImpact}><Play size={15} fill="currentColor" />Run stress test</button>
      </section>
    </>
  );

  const renderScenario = () => (
    <>
      <div className="scenario-intro"><div><span className="eyebrow">SCENARIO LAB · SAFE TO EXPERIMENT</span><h2>What if your key person is unavailable?</h2><p>Test a disruption against the same seeded team. Changes stay hypothetical and never alter employee records.</p></div><button className="button button-quiet" onClick={resetSimulation}><RotateCcw size={15} />Reset scenario</button></div>
      <div className="scenario-controls panel">
        <label className="field"><span>Disruption type</span><select value={scenarioType} onChange={event => setScenarioType(event.target.value as ScenarioType)}>{typeOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
        <label className="field"><span>Employee affected</span><select value={employeeId} onChange={event => setEmployeeId(event.target.value)}>{EMPLOYEES.map(person => <option key={person.id} value={person.id}>{person.name} · {person.role}</option>)}</select></label>
        <fieldset className="field duration-field"><legend>Duration</legend><div className="segmented-control"><button className={days === 7 ? "selected" : ""} onClick={() => setDays(7)} type="button">7 days</button><button className={days === 14 ? "selected" : ""} onClick={() => setDays(14)} type="button">14 days</button></div></fieldset>
        <button className="button button-primary simulate-button" onClick={runSimulation}><Activity size={16} />{scenario ? "Re-run simulation" : "Run simulation"}</button>
      </div>

      <div className="timeline panel">
        <div className="timeline-title"><span className="eyebrow">SCENARIO TIMELINE</span><span className="timeline-hint">No source records changed</span></div>
        <div className="timeline-track">
          {["Today · baseline", disruptionLabel, "Day 7 · work at risk", `Day ${timelineImpactDay} · impact`, recoveryApplied ? "Recovery applied" : "Recovery available"].map((label, index) => {
            const active = index === 0 ? !scenario : index === 1 ? !!scenario : index === 4 ? recoveryApplied : !!scenario && (index === 2 || timelineImpactDay >= 14);
            const done = index === 0 ? !!scenario : index < 4 && !!scenario;
            return <div className={`timeline-step ${active ? "active" : ""} ${done ? "done" : ""}`} key={label}><span className="timeline-node">{done ? <Check size={12} /> : index + 1}</span><span>{label}</span></div>;
          })}
        </div>
      </div>

      <div className="scenario-results-grid">
        <section className="panel scenario-result before-result">
          <div className="panel-heading"><div><span className="eyebrow">{scenario ? "AFTER DISRUPTION · BEFORE RECOVERY" : "CURRENT STATE"}</span><h2>{scenario ? `${impactedEmployee.name} · ${getScenarioLabel(scenario.type)}` : "Current project baseline"}</h2></div><span className={`risk-pill ${classForRisk(beforeComparison.risk)}`}><span className="risk-dot" />{beforeComparison.risk}</span></div>
          <div className="result-stats"><div><span>Team readiness</span><button className="result-score" onClick={() => showScoreFactors(beforeComparison)}>{beforeComparison.readiness}<small>/100</small></button><small>{scenario ? `↓ from ${projectBaseline.readiness} baseline` : "Deliverable today"}</small></div><div><span>Continuity score</span><button className="result-score" onClick={() => showScoreFactors(beforeComparison)}>{beforeComparison.continuity}<small>/100</small></button><small>Weighted resilience index</small></div><div><span>Cybersecurity coverage</span><strong className={beforeComparison.cybersecurityCoverage === 0 ? "text-critical" : ""}>{beforeComparison.cybersecurityCoverage}<small>%</small></strong><small>{activeProject.requirements.some(item => item.skill.toLowerCase() === "cybersecurity") ? beforeComparison.cybersecurityCoverage === 0 ? "No backup available" : "Qualified coverage" : "No project requirement"}</small></div><div><span>Expected delay</span><strong>{formatDelay(beforeComparison.expectedDelayDays)}</strong><small>{beforeComparison.expectedDelayDays >= 14 ? "Critical delivery buffer" : beforeComparison.expectedDelayDays ? "Recovery buffer needed" : "On current plan"}</small></div></div>
          <div className="scenario-evidence"><span className="evidence-icon"><AlertTriangle size={15} /></span><p><strong>Evidence:</strong> {scenario ? beforeComparison.evidence : projectBaseline.evidence}</p></div>
          <div className="scenario-component-list"><span className="eyebrow">CONTINUITY COMPONENTS · BEFORE RECOVERY</span><ScoreBars factors={beforeComparison.factors} onClick={() => showScoreFactors(beforeComparison)} /></div>
        </section>

        <section className={`panel scenario-result after-result ${recoveryApplied ? "recovery-live" : ""}`}>
          <div className="panel-heading"><div><span className="eyebrow">PROPOSED RECOVERY</span><h2>{recoveryStrategy === "cross-train" ? "Train a verified backup" : "Redistribute work now"}</h2></div><span className={`recovery-state ${recoveryApplied ? "applied" : ""}`}>{recoveryApplied ? <><Check size={13} />Applied to scenario</> : <><Sparkles size={13} />Plan preview</>}</span></div>
          <div className="recovery-options" aria-label="Compare recovery plans">
            <button className={`recovery-option ${recoveryStrategy === "cross-train" ? "selected" : ""}`} onClick={() => { setRecoveryStrategy("cross-train"); setRecoveryApplied(false); }}><span><ShieldCheck size={13} />Cross-train backup</span><strong>{proposedRecoveryMetrics.continuity}% <small>continuity</small></strong><small>{proposedRecoveryMetrics.factors.backupCoverage}% backup coverage · {formatDelay(proposedRecoveryMetrics.expectedDelayDays)} delay</small><i>Recommended · 2 weeks</i></button>
            <button className={`recovery-option ${recoveryStrategy === "redistribute" ? "selected" : ""}`} onClick={() => { setRecoveryStrategy("redistribute"); setRecoveryApplied(false); }}><span><Users size={13} />Redistribute now</span><strong>{redistributionPreview.continuity}% <small>continuity</small></strong><small>{redistributionPreview.factors.backupCoverage}% backup coverage · {formatDelay(redistributionPreview.expectedDelayDays)} delay</small><i>Faster · residual risk remains</i></button>
          </div>
          <div className="recovery-headline"><strong>{recoveryApplied ? metrics.continuity : afterComparison.continuity}<small>%</small></strong><span>modeled continuity<br /><em>+{Math.max(0, afterComparison.continuity - beforeComparison.continuity)} pts after recovery</em></span></div>
          <div className="recovery-outcomes"><div><span>Backup coverage</span><strong>{afterComparison.factors.backupCoverage}%</strong><Meter value={afterComparison.factors.backupCoverage} tone="green" /></div><div><span>Expected delay</span><strong>{formatDelay(afterComparison.expectedDelayDays)}</strong><Meter value={Math.max(10, 100 - afterComparison.expectedDelayDays * 4)} tone="green" /></div><div><span>{primaryDependency?.skill ?? "Critical skill"} backup</span><strong>{recoveryStrategy === "cross-train" ? `${primaryBackup?.name ?? "Candidate"} · training plan` : "No verified backup"}</strong><small>{recoveryStrategy === "cross-train" ? "4 sessions + practical verification" : "Interim workload cover only"}</small></div></div>
          <div className="workload-compare"><span className="eyebrow">WORKLOAD BALANCE · BEFORE → PROPOSED</span>{workloadPlan.map(row => <div className="workload-compare-row" key={row.employee.id}><span>{row.employee.name.split(" ")[0]}</span><span>{row.current}%</span><ArrowRight size={11} /><strong>{row.proposed}%</strong></div>)}</div>
          <div className="remaining-risk"><AlertTriangle size={14} /><span><strong>Risk that remains:</strong> {remainingRiskDescription}</span></div>
          <div className="recovery-actions"><span><ShieldCheck size={15} />{canApplyRecovery ? recoveryStrategy === "cross-train" ? `Suggested: pair ${primaryBackup?.name ?? "a backup"} with ${impactedEmployee.name}` : "Interim: spread work across the available team" : `Run a disruption affecting a critical owner to apply this plan`}</span><button className={`button ${recoveryApplied ? "button-quiet" : "button-success"}`} disabled={!canApplyRecovery} onClick={() => setRecoveryApplied(value => !value)}>{recoveryApplied ? <><RotateCcw size={15} />Undo recovery</> : <><Check size={15} />Apply to scenario</>}</button></div>
          <p className="scenario-disclaimer">Hypothetical model only. Original workload, availability and employee records remain unchanged.</p>
        </section>
      </div>

      <div className="impact-banner"><div className="impact-icon"><ShieldAlert size={17} /></div><div><strong>{scenario ? `${metrics.risk} risk · ${metrics.impactedSkill} is the first failure point` : "Ready to stress-test your current team"}</strong><p>{scenario ? metrics.expectedDelayDays >= 14 ? `${metrics.impactedSkill} work is blocked; ${formatDelay(metrics.expectedDelayDays)} delay is estimated until coverage is restored.` : "This scenario reduces the delivery buffer. Compare the recovery plan before changing assignments." : "Select a disruption above to reveal project impact, backup coverage and a recovery option."}</p></div><button className="text-button" onClick={() => openCopilot(`What breaks if ${primaryOwner.name.split(" ")[0]} is absent?`)}>Ask Copilot <ArrowRight size={14} /></button></div>
    </>
  );

  const renderPeople = () => {
    const filtered = EMPLOYEES.filter(person => `${person.name} ${person.role} ${person.department} ${Object.keys(person.skills).join(" ")}`.toLowerCase().includes(searchTerm.toLowerCase()));
    return <>
      <SectionTitle eyebrow="WORKFORCE DIRECTORY · SEE BEYOND SKILLS" title="People & resilience passports" subtitle="Capability, capacity and backup readiness—together, not in separate spreadsheets." action={<label className="search-field"><Search size={15} /><input value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Search people or skills" aria-label="Search people or skills" /></label>} />
      {filtered.length ? <div className="people-grid">{filtered.map(person => {
        const unavailable = Boolean(scenario && scenario.employeeId === person.id && ["absence", "resignation", "unavailable"].includes(scenario.type));
        const score = calculateEmployeeScore(person, unavailable, activeProject, EMPLOYEES);
        return <button className="person-card panel" key={person.id} onClick={() => setDetailEmployee(person)}>
          <div className="person-card-top"><Avatar employee={person} /><span className={`workload-tag ${person.workload > 85 ? "critical" : person.workload > 65 ? "medium" : "safe"}`}>{person.workload}% workload</span></div>
          <strong className="person-name">{person.name}</strong><span className="person-role">{person.role} · {person.department}</span>
          <div className="person-skills">{Object.entries(person.skills).map(([skill, level]) => <span className="skill-chip" key={skill}>{skill} <b>{level}</b></span>)}</div>
          <div className="person-card-bottom"><span>Availability <b>{person.availability}%</b></span><span className={`fit-score ${score.excluded ? "excluded" : ""}`}>{score.excluded ? "Excluded · unavailable" : `Fit ${score.score}`}</span></div>
        </button>;
      })}</div> : <div className="panel people-empty" role="status"><Search size={18} /><div><strong>No employees match “{searchTerm}”</strong><span>Try another name, role, department or skill.</span></div><button className="text-button" onClick={() => setSearchTerm("")}>Clear search <ArrowRight size={13} /></button></div>}
      <div className="panel people-note"><ShieldCheck size={17} /><span><strong>Resilience passport:</strong> each profile includes can-own, can-backup, needs-training, verification history and project single-point-of-failure links.</span></div>
    </>;
  };

  const renderSkills = () => <>
    <SectionTitle eyebrow="PROJECT SKILL DEPENDENCIES" title="Knowledge concentration map" subtitle="A bus-factor view of who can keep each critical workstream moving. Select any skill to inspect its owner and dependency path." action={<div className="view-switch"><button className={skillView === "list" ? "selected" : ""} onClick={() => setSkillView("list")}><Menu size={14} />List</button><button className={skillView === "graph" ? "selected" : ""} onClick={() => setSkillView("graph")}><Activity size={14} />Graph</button></div>} />
    <section className="panel full-panel skill-table-panel">
      <div className="table-caption"><span>{activeProject.client.toUpperCase()} · {activeProject.requirements.length} required skills</span><span>Thresholds: {Array.from(new Set(activeProject.requirements.map(item => item.minimum))).sort((a, b) => a - b).map(value => `≥${value}%`).join(" · ")}</span></div>
      {skillView === "list" ? <div className="skill-table" role="table" aria-label="Project skill and backup coverage"><div className="skill-table-head" role="row"><span>Skill</span><span>Owner</span><span>Capable employees</span><span>Backup readiness</span><span>Risk</span></div>{skillInventory.map(item => {
        const backupNames = item.capableNames.filter(name => name !== item.owner.name);
        const candidate = getSuggestedBackup(activeProject, item.skill, item.owner.id, EMPLOYEES);
        return <button className="skill-table-row" key={item.skill} onClick={() => setDetailSkill(item.skill)} role="row"><span className="table-skill-name"><span className={`skill-glyph skill-${item.skill.toLowerCase()}`}>{item.skill.slice(0, 1)}</span><strong>{item.skill}</strong>{item.critical && <small>Critical</small>}</span><span className="table-owner"><Avatar employee={item.owner} small />{item.owner.name}</span><span className="capable-count">{item.capableCount} {item.capableCount === 1 ? "person" : "people"}<small>{item.capableNames.join(", ")}</small></span><span className="table-backup">{backupNames.length ? recoveryApplied && recoveryStrategy === "cross-train" ? `Hypothetical · ${backupNames.join(", ")}` : `Ready · ${backupNames.join(", ")}` : candidate ? `${candidate.name} · needs training` : "No ready candidate"}</span><span><span className={`risk-pill ${classForRisk(item.risk)}`}><span className="risk-dot" />{item.risk}</span></span></button>;
      })}</div> : <div className="skill-graph" aria-label="Skill relationship map"><div className="graph-project-node"><Cloud size={16} /><span><strong>{activeProject.client}</strong><small>Project · {activeProject.requirements.length} required skills</small></span></div><div className="graph-connectors" aria-hidden="true">{skillInventory.map(item => <i key={item.skill} />)}</div><div className="graph-skill-grid">{skillInventory.map(item => <button key={item.skill} className="graph-skill-node" onClick={() => setDetailSkill(item.skill)}><span className="graph-skill-top"><span className={`skill-glyph skill-${item.skill.toLowerCase()}`}>{item.skill.slice(0, 1)}</span><span className={`risk-pill ${classForRisk(item.risk)}`}><span className="risk-dot" />{item.risk}</span></span><strong>{item.skill}</strong><small>{item.capableCount} capable · {item.capableCount > 1 ? "shared knowledge" : "single owner"}</small><span className="graph-owner"><Avatar employee={item.owner} small />{item.owner.name.split(" ")[0]}{item.capableNames.filter(name => name !== item.owner.name).length ? ` + ${item.capableNames.filter(name => name !== item.owner.name).join(", ")}` : ""}</span></button>)}</div></div>}
      <div className="table-legend"><span><i className="legend-dot critical-dot" />Critical = 1 qualified person</span><span><i className="legend-dot medium-dot" />Medium = 2 qualified people</span><span><i className="legend-dot safe-dot" />Low = 3+ qualified people</span></div>
    </section>
    <div className="panel info-callout"><Shield size={17} /><div><strong>Skills are dependencies, not just tags.</strong><p>Clicking a row reveals proficiency, current owner, capable backups, project links and the shortest knowledge-transfer path. A “ready” backup requires demonstrated proficiency, not just a matching keyword.</p></div></div>
  </>;

  const renderKnowledge = () => <>
    <SectionTitle eyebrow={`RECOVERY PLAN · ${recoverySkillName.toUpperCase()}`} title="Turn expertise into shared capability" subtitle={`A four-session plan pairs ${primaryBackup?.name ?? "a learner"} with ${primaryOwner.name} to build and verify ${recoverySkillName} coverage.`} action={<button className={`button ${sessionsScheduled ? "button-quiet" : "button-primary"}`} onClick={() => setSessionsScheduled(value => !value)}>{sessionsScheduled ? <><Check size={15} />Sessions scheduled</> : <><CalendarDays size={15} />Schedule sessions</>}</button>} />
    <div className="knowledge-overview"><section className="panel knowledge-owner"><span className="eyebrow">KNOWLEDGE OWNER</span><div className="knowledge-person"><Avatar employee={primaryOwner} /><div><strong>{primaryOwner.name}</strong><span>{primaryOwner.role} · {primaryOwner.skills[recoverySkillName] ?? 0}% proficiency</span></div></div><div className="knowledge-divider" /><div className="knowledge-skill"><span>Critical skill</span><strong>{recoverySkillName}</strong><span className={`risk-pill ${primaryDependency?.capableCount === 1 ? "critical" : "safe"}`}><span className="risk-dot" />{primaryDependency?.capableCount === 1 ? "Single owner" : "Shared coverage"}</span></div>{primaryBackup && <div className="knowledge-person backup-person"><Avatar employee={primaryBackup} /><div><strong>{primaryBackup.name}</strong><span>{primaryBackup.role} · {primaryBackup.availability}% availability · {primaryBackup.workload}% workload</span></div><span className="training-tag">{recoveryApplied && recoveryStrategy === "cross-train" && recoveryBackupReady ? "Hypothetical backup" : "Learner · unverified"}</span></div>}<div className="backup-readiness"><span>Project critical backup coverage</span><strong>{(scenario ? scenarioMetrics(scenario, recoveryApplied, recoveryStrategy) : recoveryPreview).factors.backupCoverage}%</strong><Meter value={(scenario ? scenarioMetrics(scenario, recoveryApplied, recoveryStrategy) : recoveryPreview).factors.backupCoverage} tone="green" /></div></section>
      <section className="panel recovery-plan-panel"><div className="panel-heading"><div><span className="eyebrow">KNOWLEDGE-TRANSFER PLAN</span><h2>Four sessions. One verification gate.</h2></div><span className="plan-time"><Clock3 size={14} />2 weeks</span></div><div className="session-list">{knowledgeSteps.map((step, index) => <div className="session-row" key={step.title}><span className={`session-number ${sessionsScheduled ? "scheduled" : ""}`}>{sessionsScheduled ? <Check size={13} /> : `0${index + 1}`}</span><div className="session-copy"><small>{step.week}</small><strong>{step.title}</strong><span>{step.owner}</span></div><span className={`session-status ${sessionsScheduled ? "scheduled" : ""}`}>{sessionsScheduled ? "Scheduled" : step.status}</span></div>)}</div><div className="verification-note"><BadgeCheck size={16} /><span><strong>Ready means proven.</strong> The learner stays unverified until they complete a real {recoverySkillName} task with {primaryOwner.name}'s review.</span></div></section></div>
    <section className="panel training-recommendation"><span className="training-course-icon"><GraduationCap size={18} /></span><div className="training-course-copy"><span className="eyebrow">SUGGESTED TRAINING · 2 WEEKS</span><strong>{suggestedCourse}</strong><p>Learner: {primaryBackup?.name ?? "Identify a learner"} · mentor: {primaryOwner.name} · four sessions with a practical verification gate.</p></div><div className="training-readiness"><span>Expected readiness</span><strong>{expectedBackupReadiness}</strong><small>Do not mark verified until the project skill threshold is demonstrated.</small></div></section>
    <div className="panel extension-plan"><div className="extension-icon"><Sparkles size={18} /></div><div><span className="eyebrow">NEXT COVERAGE WINS</span><strong>{remainingSingleOwnerSkills.length ? `Close ${remainingSingleOwnerSkills.length} remaining single-owner skill${remainingSingleOwnerSkills.length === 1 ? "" : "s"}` : "Critical backups covered in this scenario"}</strong><p>{remainingSingleOwnerSkills.length ? `${remainingSingleOwnerSkills.map(item => item.skill).join(", ")} still need a verified backup. Schedule another mentor-led handover and practical verification for each.` : "All critical project skills have a second capable employee in the hypothetical recovery state."}</p></div><span className="recovery-state"><ArrowUpRight size={14} />{(scenario ? scenarioMetrics(scenario, recoveryApplied, recoveryStrategy) : recoveryPreview).factors.backupCoverage}% backup coverage</span></div>
  </>;

  const renderTeamBuilder = () => <>
    <SectionTitle eyebrow="RESILIENT TEAM BUILDER" title="The strongest team is not always the safest team" subtitle="Balance project skill match with workload, backup readiness and knowledge concentration." action={<button className="button button-quiet" onClick={() => showEmployeeScore(recommendedTeam[0] ?? EMPLOYEES[0])}><CircleHelp size={15} />Why this team?</button>} />
    <section className="panel team-recommendation"><div className="team-recommendation-header"><div><span className="eyebrow">RECOMMENDED · {activeProject.client.toUpperCase()}</span><h2>{scenarioHasUnavailableEmployee ? `${impactedEmployee.name} excluded for this scenario` : `${recommendedTeam.length} contributors balance delivery and capacity.`}</h2><p>{scenarioHasUnavailableEmployee ? `The recommendation excludes ${impactedEmployee.name} for this scenario; original workforce records remain unchanged.` : `The current team covers ${skillCoverageCount} of ${activeProject.requirements.length} required skills without assigning overloaded employees full-time.`}</p></div><div className="team-score-pair"><button onClick={() => showScoreFactors(beforeComparison)}><strong>{beforeComparison.continuity}%</strong><span>Continuity</span></button><span className="score-arrow">→</span><button onClick={() => selectPage("scenario")}><strong>{afterComparison.continuity}%</strong><span>Recovery option</span></button></div></div><div className="team-builder-table"><div className="team-builder-head"><span>Employee</span><span>Primary contribution</span><span>Skill fit</span><span>Availability</span><span>Workload risk</span><span>Decision</span></div>{suggestedTeamMembers.map(person => {
      const unavailable = Boolean(scenario && scenario.employeeId === person.id && ["absence", "resignation", "unavailable"].includes(scenario.type));
      const isRecommended = recommendedTeam.some(member => member.id === person.id);
      const isBackup = primaryBackup?.id === person.id;
      const included = !unavailable && (isRecommended || recoveryApplied && recoveryStrategy === "cross-train" && isBackup);
      const decision = unavailable ? "Unavailable" : included ? isBackup && !isRecommended ? "Backup added" : "Selected" : person.workload > 85 ? "Avoid full-time" : isBackup ? "Train as backup" : "Alternate";
      const skillName = Object.keys(person.skills).find(skill => activeProject.requirements.some(req => req.skill === skill)) ?? Object.keys(person.skills)[0] ?? "Adjacent skills";
      const match = person.skills[skillName] ?? 0;
      return <div className={`team-builder-row ${!included ? "not-selected" : ""}`} key={person.id}><span className="table-owner"><Avatar employee={person} small /><span><strong>{person.name}</strong><small>{person.role}</small></span></span><span>{skillName} · {match}%</span><span><Meter value={match} /><strong>{match}%</strong></span><span>{unavailable ? "Excluded" : `${person.availability}%`}</span><span><span className={`workload-tag ${person.workload > 85 ? "critical" : person.workload > 65 ? "medium" : "safe"}`}>{person.workload}%</span></span><span className={`decision-tag ${included ? "selected" : "alternate"}`}>{decision}</span></div>;
    })}</div><div className="team-builder-footer"><div><ShieldCheck size={16} /><span><strong>Explainable recommendation.</strong> Proficiency, availability, experience and workload remain visible for every candidate.</span></div><button className="text-button" onClick={() => showEmployeeScore(EMPLOYEES.find(person => person.id === "priya") ?? suggestedTeamMembers[suggestedTeamMembers.length - 1])}>Why not Priya? <ArrowRight size={14} /></button></div></section>
    <div className="team-factor-grid"><div className="panel factor-card"><span>Skill coverage</span><strong>{beforeComparison.factors.skillCoverage}%</strong><small>{skillCoverageCount} of {activeProject.requirements.length} required workstreams at threshold</small></div><div className="panel factor-card"><span>Workload safety</span><strong>{beforeComparison.factors.workloadSafety}%</strong><small>Recommended employees at or below 85% projected load</small></div><div className="panel factor-card"><span>Backup coverage</span><strong className={beforeComparison.factors.backupCoverage === 0 ? "text-critical" : ""}>{beforeComparison.factors.backupCoverage}%</strong><small>{beforeComparison.factors.backupCoverage === 0 ? `${criticalDependencyCount} critical skills need a second expert` : "Critical skills with two capable employees"}</small></div><div className="panel factor-card"><span>Deadline feasibility</span><strong>{beforeComparison.deadlineFeasibility}%</strong><small>{activeProject.weeksRemaining}-week project window</small></div></div>
    <section className="panel workload-chart-panel"><div className="panel-heading"><div><span className="eyebrow">CAPACITY · BEFORE VS PROPOSED</span><h2>Rebalance without adding overload</h2><p>Compare current workload with the selected recovery plan; the dashed line marks the 85% overload threshold.</p></div><div className="chart-legend"><span><i className="chart-key current" />Current</span><span><i className="chart-key proposed" />Proposed</span></div></div><div className="workload-chart"><ResponsiveContainer width="100%" height={215}><BarChart data={workloadChartData} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}><CartesianGrid stroke="#e4ddd3" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fill: "#748087", fontSize: 9 }} axisLine={{ stroke: "#ddd5c9" }} tickLine={false} /><YAxis domain={[0, 100]} tick={{ fill: "#748087", fontSize: 8 }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: "rgba(68,141,137,.07)" }} contentStyle={{ background: "#fffefa", border: "1px solid #ddd5c9", borderRadius: 7, color: "#263a46", fontSize: 9 }} formatter={(value) => [`${value}%`, "Workload"]} /><ReferenceLine y={85} stroke="#bb4d58" strokeDasharray="5 4" label={{ value: "Overload 85%", fill: "#9e4750", fontSize: 8 }} /><Bar dataKey="Current" fill="#87a3ad" radius={[4, 4, 0, 0]} maxBarSize={26} /><Bar dataKey="Proposed" fill="#448d89" radius={[4, 4, 0, 0]} maxBarSize={26} /></BarChart></ResponsiveContainer></div></section>
    <section className="team-compare-section"><div className="section-title"><div><span className="eyebrow">RECOVERY PLAN COMPARISON</span><h2>Compare the plan, not just the people</h2><p>These options use the same employee and project records as the scenario engine. Choose one to inspect its evidence.</p></div></div><div className="team-compare-grid"><button className="panel team-compare-card" onClick={() => { setScenario(currentDemoScenario); setRecoveryApplied(false); setPage("scenario"); }}><span className="team-compare-label">CURRENT · BEFORE DISRUPTION</span><strong>{projectBaseline.factors.skillCoverage}% <small>skill coverage</small></strong><div><span>Continuity</span><b className={classForRisk(projectBaseline.risk) === "critical" ? "text-critical" : ""}>{projectBaseline.continuity}%</b></div><div><span>Workload safety</span><b>{projectBaseline.factors.workloadSafety}%</b></div><p>{projectBaseline.evidence}</p><span className="text-button">Inspect baseline <ArrowRight size={13} /></span></button><button className="panel team-compare-card recommended-team-card" onClick={() => { setScenario(currentDemoScenario); setRecoveryStrategy("cross-train"); setRecoveryApplied(false); setPage("scenario"); }}><span className="team-compare-label">CROSS-TRAIN · RECOMMENDED</span><strong>{proposedRecoveryMetrics.factors.skillCoverage}% <small>skill coverage</small></strong><div><span>Continuity</span><b>{proposedRecoveryMetrics.continuity}%</b></div><div><span>Backup coverage</span><b>{proposedRecoveryMetrics.factors.backupCoverage}%</b></div><p>{proposedRecoveryMetrics.evidence}</p><span className="text-button">Compare with baseline <ArrowRight size={13} /></span></button><button className="panel team-compare-card" onClick={() => { setScenario(currentDemoScenario); setRecoveryStrategy("redistribute"); setRecoveryApplied(false); setPage("scenario"); }}><span className="team-compare-label">REDISTRIBUTE · INTERIM</span><strong>{redistributionPreview.factors.skillCoverage}% <small>skill coverage</small></strong><div><span>Continuity</span><b>{redistributionPreview.continuity}%</b></div><div><span>Expected delay</span><b>{formatDelay(redistributionPreview.expectedDelayDays)}</b></div><p>{redistributionPreview.evidence}</p><span className="text-button">Inspect residual risk <ArrowRight size={13} /></span></button></div></section>
  </>;

  const renderPage = () => {
    if (page === "scenario") return renderScenario();
    if (page === "people") return renderPeople();
    if (page === "skills") return renderSkills();
    if (page === "knowledge") return renderKnowledge();
    if (page === "project") return renderTeamBuilder();
    if (page === "twin") return <WorkforceTwin activeProject={activeProject} employees={EMPLOYEES} scenario={scenario} recoveryApplied={recoveryApplied} recoveryStrategy={recoveryStrategy} onRunScenario={employeeId => { setScenario({ type: "absence", employeeId, days: 14 }); setScenarioType("absence"); setEmployeeId(employeeId); setDays(14); setRecoveryApplied(false); setRecoveryStrategy("cross-train"); selectPage("scenario"); }} onOpenKnowledge={() => selectPage("knowledge")} onAskCopilot={openCopilot} />;
    return renderOverview();
  };

  const detailSkillRecord = detailSkill ? skillInventory.find(item => item.skill === detailSkill) : undefined;
  const detailSkillBaseline = detailSkill ? baselineSkillInventory.find(item => item.skill === detailSkill) : undefined;
  const detailSkillBackup = detailSkillRecord ? getSuggestedBackup(activeProject, detailSkillRecord.skill, detailSkillRecord.owner.id, EMPLOYEES) : null;
  const detailSkillTrainingApplied = Boolean(recoveryApplied && recoveryStrategy === "cross-train" && detailSkillRecord && detailSkillBaseline && detailSkillRecord.capableCount > detailSkillBaseline.capableCount);
  const detailEmployeeUnavailable = Boolean(detailEmployee && scenario && scenario.employeeId === detailEmployee.id && ["absence", "resignation", "unavailable"].includes(scenario.type));
  const detailScore = detailEmployee ? calculateEmployeeScore(detailEmployee, detailEmployeeUnavailable, activeProject, EMPLOYEES).score : 0;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${showMobileNav ? "mobile-open" : ""}`}>
        <button className="brand-lockup" onClick={() => selectPage("overview")} aria-label="ContinuityOS home"><span className="brand-symbol"><span /><span /><span /></span><span className="brand-copy"><strong>Continuity<span>OS</span></strong><small>RESILIENCE CONTROL</small></span></button>
        <div className="workspace-switch"><span className="workspace-mark">{activeProject.client.slice(0, 2).toUpperCase()}</span><span><small>WORKSPACE</small><strong>{activeProject.client}</strong></span><ChevronDown size={14} /></div>
        <span className="nav-section-label">WORKSPACE</span>
        <nav className="side-nav" aria-label="Main navigation">{navItems.map(item => { const Icon = item.icon; return <button className={`nav-item ${page === item.id ? "active" : ""}`} key={item.id} onClick={() => selectPage(item.id)}><Icon size={17} /><span>{item.label}</span>{item.count && <small>{scenario ? "LIVE" : item.count}</small>}</button>; })}</nav>
        <button className="new-project-button" onClick={openNewProject}><Plus size={15} />New project</button>
        <button className="new-project-button edit-project-button" onClick={editActiveProject}><Pencil size={14} />Edit active project</button>
        <div className="sidebar-spacer" />
        <div className="sidebar-status"><span className="online-dot" /><span>Demo environment</span><span className="demo-badge">SAMPLE</span></div>
        <button className="sidebar-signout" onClick={onSignOut}><LogOut size={14} /><span>Sign out of demo</span></button>
        <button className="profile-switch" onClick={() => setDetailEmployee(getEmployee("kavya"))}><span className="manager-avatar">KR</span><span><strong>Kavya Rao</strong><small>Workforce manager</small></span><ChevronDown size={14} /></button>
      </aside>

      <div className="main-shell">
        <header className="topbar"><button className="mobile-menu" onClick={() => setShowMobileNav(value => !value)} aria-label="Toggle navigation">{showMobileNav ? <X size={19} /> : <Menu size={19} />}</button><div className="breadcrumb"><span>Projects</span><ChevronRight size={14} /><strong>{activeTitle === "Overview" ? activeProject.client : activeTitle}</strong></div><div className="topbar-actions"><span className="live-status"><i className="online-dot" />LIVE DEMO</span><button className="topbar-help" onClick={() => openCopilot() }><CircleHelp size={15} /><span>Help</span></button><button className="button button-primary demo-button" onClick={startJudgeDemo}><Play size={14} fill="currentColor" />Start judge demo</button></div></header>
        <main className="content-area">
          <div className="page-heading"><div><div className="page-kicker"><span className="kicker-line" />PROJECT CONTINUITY · {activeProject.domain.toUpperCase()}</div><h1>{page === "overview" ? <>Build teams that can <em>survive uncertainty.</em></> : page === "scenario" ? "Scenario lab" : page === "people" ? "People & resilience" : page === "skills" ? "Skill resilience" : page === "knowledge" ? "Knowledge transfer" : page === "twin" ? "Workforce digital twin" : "Resilient team builder"}</h1><p>{page === "overview" ? "Know what breaks before the project does." : page === "scenario" ? "Stress-test a team. Compare recovery. Keep the original untouched." : page === "people" ? "Skills show what people know. Resilience shows what happens next." : page === "skills" ? "Find the knowledge that only one person can carry." : page === "knowledge" ? "Make critical knowledge teachable, testable and shared." : page === "twin" ? "Explore the people, skills, tasks and projects behind project continuity." : "Balance capability with capacity, backup and delivery confidence."}</p></div><div className="project-context"><span className="project-context-icon"><Cloud size={17} /></span><div><small>ACTIVE PROJECT</small><strong>{activeProject.client}</strong><span>{activeProject.domain} · {activeProject.deadline} · <i className="priority-dot" />{activeProject.priority} priority</span></div><button className="icon-button subtle" onClick={() => selectPage("project")} aria-label="Open project details"><ArrowUpRight size={16} /></button></div></div>
          {projectSaved && <div className="project-save-note" role="status"><Check size={14} />Local project activated: <strong>{activeProject.client}</strong>. Team and risk scores now use its extracted skills.<button onClick={() => setProjectSaved(false)}>Dismiss</button></div>}
          {renderPage()}
          <footer className="app-footer"><span>CONTINUITYOS · WORKFORCE RESILIENCE LAYER</span><span>Sample workforce data · Last recalculated just now</span><button onClick={() => openCopilot("Explain this risk")}>How are scores calculated? <ArrowRight size={12} /></button></footer>
        </main>
      </div>

      <CopilotDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} metrics={metrics} context={copilotContext} />
      <ScoreDetailDialog open={scoreOpen} onClose={() => setScoreOpen(false)} factors={scoreFactors} readiness={scoreReadiness} deadlineFeasibility={scoreDeadlineFeasibility} employee={scoreEmployee} project={activeProject} employees={EMPLOYEES} unavailableDuringDeadline={Boolean(scoreEmployee && scenario && scenario.employeeId === scoreEmployee.id && ["absence", "resignation", "unavailable"].includes(scenario.type))} />

      {detailEmployee && <div className="modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && setDetailEmployee(null)}><section className="detail-modal person-modal" role="dialog" aria-modal="true" aria-labelledby="employee-title"><header className="modal-header"><div><span className="eyebrow">RESILIENCE PASSPORT</span><h2 id="employee-title">{detailEmployee.name}</h2></div><button className="icon-button" onClick={() => setDetailEmployee(null)} aria-label="Close profile"><X size={18} /></button></header><div className="profile-modal-head"><Avatar employee={detailEmployee} /><div><strong>{detailEmployee.role}</strong><span>{detailEmployee.department} · {detailEmployee.experienceYears} years experience</span></div><span className={`workload-tag ${detailEmployee.workload > 85 ? "critical" : detailEmployee.workload > 65 ? "medium" : "safe"}`}>{detailEmployee.workload}% load</span></div><div className="profile-stat-row"><span>Availability <strong>{detailEmployee.availability}%</strong></span><span>Domain experience <strong>{detailEmployee.domainExperience}%</strong></span><span>Employee fit <button className="inline-score" onClick={() => showEmployeeScore(detailEmployee)}>{detailScore}<ArrowUpRight size={12} /></button></span></div><div className="profile-section"><strong>Verified skills</strong><div className="person-skills">{Object.entries(detailEmployee.skills).map(([skill, level]) => <span className="skill-chip" key={skill}>{skill} <b>{level}%</b></span>)}</div></div><div className="profile-section"><strong>Can own</strong><p>{Object.keys(detailEmployee.skills).filter(skill => detailEmployee.skills[skill] >= 80).join(", ") || "No project skill above the proficiency threshold yet"}</p></div><div className="profile-section"><strong>Can back up</strong><p>{detailEmployee.backupReady.join(", ") || "Not yet verified for a critical backup"}</p></div><div className="profile-section"><strong>Mentor readiness</strong><p>{detailEmployee.mentorReady?.join(", ") || "No verified mentor skills recorded"}</p></div><div className="profile-section"><strong>Needs training</strong><p>{activeProject.requirements.filter(requirement => (detailEmployee.skills[requirement.skill] ?? 0) < requirement.minimum).map(requirement => `${requirement.skill} (${detailEmployee.skills[requirement.skill] ?? 0}% → ${requirement.minimum}%)`).join(" · ") || "No priority training flagged for this project"}</p></div><div className="profile-section"><strong>Knowledge-transfer history</strong><p>{detailEmployee.id === primaryOwner.id ? `Owner of ${primaryDependency?.skill ?? "the critical skill"} on ${activeProject.client} · ${recoveryApplied && recoveryStrategy === "cross-train" && recoveryBackupReady ? "hypothetical backup plan applied" : "no verified successor"}` : detailEmployee.training.join(" · ")}</p></div><div className="profile-section"><strong>Project history</strong><p>{detailEmployee.projects.join(" · ")}</p></div>{detailEmployee.id === primaryOwner.id && <button className="critical-link" onClick={() => { setDetailEmployee(null); setScenario(currentDemoScenario); setRecoveryApplied(false); selectPage("scenario"); }}><AlertTriangle size={14} />Single-person dependency on {activeProject.client} <ArrowRight size={14} /></button>}</section></div>}

      {detailSkillRecord && <div className="modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && setDetailSkill(null)}><section className="detail-modal skill-modal" role="dialog" aria-modal="true" aria-labelledby="skill-detail-title"><header className="modal-header"><div><span className="eyebrow">PROJECT SKILL DEPENDENCY</span><h2 id="skill-detail-title">{detailSkillRecord.skill}</h2></div><button className="icon-button" onClick={() => setDetailSkill(null)} aria-label="Close skill details"><X size={18} /></button></header><div className="skill-risk-detail"><span className={`risk-pill ${classForRisk(detailSkillRecord.risk)}`}><span className="risk-dot" />{detailSkillRecord.risk} dependency</span><p>{detailSkillRecord.capableCount === 1 ? `${detailSkillRecord.owner.name} is currently the only employee at or above the ${detailSkillRecord.minimum}% proficiency threshold.` : `${detailSkillRecord.capableCount} people can currently cover ${detailSkillRecord.skill}; this skill has some redundancy.`}</p></div><div className="profile-section"><strong>Current owner</strong><button className="skill-owner-detail" onClick={() => { setDetailSkill(null); setDetailEmployee(detailSkillRecord.owner); }}><Avatar employee={detailSkillRecord.owner} /><span>{detailSkillRecord.owner.name}<small>{detailSkillRecord.owner.role} · {detailSkillRecord.owner.skills[detailSkillRecord.skill]}% proficiency</small></span><ArrowUpRight size={15} /></button></div><div className="profile-section"><strong>Backup coverage</strong><p>{detailSkillTrainingApplied ? `Hypothetical recovery adds ${detailSkillRecord.capableNames.filter(name => name !== detailSkillRecord.owner.name).join(", ")} to ${detailSkillRecord.skill}; source workforce records remain unchanged.` : (detailSkillBaseline?.capableCount ?? 0) > 1 ? `${detailSkillBaseline?.capableNames.filter(name => name !== detailSkillRecord.owner.name).join(" and ")} can provide overlapping coverage.` : detailSkillBackup ? `${detailSkillBackup.name} is the recommended learner; complete four supervised sessions and a real task before verification.` : "No second person currently meets the proficiency threshold; identify a mentor and training path."}</p></div><div className="profile-section"><strong>Project dependency</strong><p>{activeProject.client} · Required skill · minimum proficiency {detailSkillRecord.minimum}% · {activeProject.weeksRemaining} weeks to deadline</p></div><button className="button button-primary full-width" onClick={() => { setDetailSkill(null); selectPage(detailSkillRecord.skill === recoverySkillName ? "knowledge" : "scenario"); }}>{detailSkillRecord.skill === recoverySkillName ? "Open knowledge-transfer plan" : "Simulate skill disruption"}<ArrowRight size={15} /></button></section></div>}

      <ProjectSetupDialog open={projectModal} mode={projectModalMode} draft={newProject} extractedSkills={extractedSkills} error={projectFormError} onDraftChange={draft => { setNewProject(draft); setProjectFormError(""); }} onSubmit={submitProject} onClose={() => { setProjectFormError(""); setProjectModal(false); }} />
    </div>
  );
}


const DEMO_SESSION_KEY = "continuityos-demo-session";

export default function Home() {
  const [signedIn, setSignedIn] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return window.sessionStorage.getItem(DEMO_SESSION_KEY) === "signed-in"; }
    catch { return false; }
  });

  const signIn = (email: string, passcode: string) => {
    if (email.trim().toLowerCase() !== DEMO_ACCESS_EMAIL || passcode !== DEMO_ACCESS_CODE) return false;
    try { window.sessionStorage.setItem(DEMO_SESSION_KEY, "signed-in"); } catch { /* The gate still works for this tab if storage is unavailable. */ }
    setSignedIn(true);
    return true;
  };

  const signOut = () => {
    try { window.sessionStorage.removeItem(DEMO_SESSION_KEY); } catch { /* Nothing to clear when storage is unavailable. */ }
    setSignedIn(false);
  };

  return signedIn ? <Dashboard onSignOut={signOut} /> : <DemoLogin onSignIn={signIn} />;
}
