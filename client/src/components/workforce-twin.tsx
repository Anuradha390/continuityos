import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import "@xyflow/react/dist/style.css";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
  type ReactFlowInstance,
} from "@xyflow/react";
import dagre from "dagre";
import {
  Activity, AlertTriangle, BadgeCheck, Boxes, Building2, Check, ChevronRight,
  CircleHelp, FileText, GitBranch, GraduationCap, List, Maximize2, Network,
  Search, Shield, ShieldAlert, UserRound, Users, Workflow, X,
} from "lucide-react";
import {
  getProjectedProficiency,
  getSuggestedCourse,
  getSkillInventory,
  type Employee,
  type Project,
  type RecoveryStrategy,
  type ScenarioInput,
} from "@/lib/continuity-engine";
import {
  buildWorkforceTwin,
  isEmployeeUnavailable,
  type TwinEntityKind,
  type TwinHealth,
  type TwinProject,
  type TwinSkill,
  type TwinTask,
} from "@/lib/workforce-twin";

export interface WorkforceTwinProps {
  activeProject: Project;
  employees: Employee[];
  scenario: ScenarioInput | null;
  recoveryApplied: boolean;
  recoveryStrategy: RecoveryStrategy;
  onRunScenario: (employeeId: string) => void;
  onOpenKnowledge: () => void;
  onAskCopilot: (prompt: string) => void;
}

type TwinSelection = { kind: TwinEntityKind; id: string };
type TwinNodeData = {
  kind: TwinEntityKind;
  title: string;
  subtitle: string;
  lines: string[];
  health: TwinHealth;
  onOpen: () => void;
};
type FlowNode = Node<TwinNodeData, "twinEntity">;
type FlowEdge = Edge<{ relation: string; health: TwinHealth }, "bezier">;

const sizeByKind: Record<TwinEntityKind, { width: number; height: number }> = {
  employee: { width: 232, height: 144 },
  skill: { width: 218, height: 126 },
  task: { width: 230, height: 134 },
  project: { width: 248, height: 148 },
};
const healthColor: Record<TwinHealth, string> = {
  healthy: "#3f8b68",
  watch: "#b77e2f",
  critical: "#bb4d58",
};
const kindIcon = {
  employee: UserRound,
  skill: Boxes,
  task: FileText,
  project: Building2,
} satisfies Record<TwinEntityKind, typeof UserRound>;
const kindLabel: Record<TwinEntityKind, string> = {
  employee: "EMPLOYEE",
  skill: "SKILL",
  task: "TASK",
  project: "PROJECT",
};

function TwinEntityNode({ data }: NodeProps<FlowNode>) {
  const Icon = kindIcon[data.kind];
  return (
    <article className={`twin-node twin-node-${data.kind} twin-health-${data.health}`}>
      <Handle type="target" position={Position.Left} className="twin-handle" aria-label="Incoming relationship" />
      <div className="twin-node-topline"><span className="twin-node-icon"><Icon size={15} /></span><span className="twin-node-kind">{kindLabel[data.kind]}</span><span className={`twin-status-mark ${data.health}`} aria-label={`${data.health} dependency`} /></div>
      <button className="twin-node-open nodrag nopan" onClick={event => { event.stopPropagation(); data.onOpen(); }} aria-label={`Open ${data.kind} details: ${data.title}`}>
        <strong>{data.title}</strong>
        <span className="twin-node-subtitle">{data.subtitle}</span>
        <span className="twin-node-lines">{data.lines.map((line, index) => <small key={`${line}-${index}`}>{line}</small>)}</span>
      </button>
      <Handle type="source" position={Position.Right} className="twin-handle" aria-label="Outgoing relationship" />
    </article>
  );
}

const nodeTypes: NodeTypes = { twinEntity: TwinEntityNode };

function autoLayout(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  const graph = new dagre.graphlib.Graph({ multigraph: true });
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: "LR", nodesep: 44, ranksep: 154, edgesep: 24, marginx: 38, marginy: 38, align: "UL" });
  nodes.forEach(node => {
    const size = sizeByKind[node.data.kind];
    graph.setNode(node.id, { width: size.width, height: size.height });
  });
  edges.forEach(edge => graph.setEdge(edge.source, edge.target, {}, edge.id));
  dagre.layout(graph);
  return nodes.map(node => {
    const point = graph.node(node.id) as { x: number; y: number };
    const size = sizeByKind[node.data.kind];
    return { ...node, position: { x: point.x - size.width / 2, y: point.y - size.height / 2 } };
  });
}

function relationshipEdge(id: string, source: string, target: string, relation: string, health: TwinHealth): FlowEdge {
  const color = healthColor[health];
  return {
    id,
    source,
    target,
    type: "bezier",
    label: relation,
    ariaLabel: `${relation}: ${source} to ${target}`,
    markerEnd: { type: MarkerType.ArrowClosed, color },
    style: { stroke: color, strokeWidth: health === "critical" ? 2.1 : 1.45, opacity: 0.7 },
    labelStyle: { fill: health === "critical" ? "#963742" : health === "watch" ? "#8b6224" : "#356d54", fontSize: 8, fontWeight: 650 },
    labelBgStyle: { fill: "#fffdf9", fillOpacity: 0.92 },
    labelBgPadding: [4, 2],
    labelBgBorderRadius: 4,
    data: { relation, health },
  };
}

function createGraph(model: ReturnType<typeof buildWorkforceTwin>, open: (selection: TwinSelection) => void): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const skillsByName = new Map(model.skills.map(skill => [skill.name, skill]));
  const projectsById = new Map(model.projects.map(project => [project.project.id, project]));

  model.employees.forEach(employee => {
    const verified = model.skills.filter(skill => (employee.skills[skill.name] ?? 0) >= skill.minimum).map(skill => `${skill.name} ${employee.skills[skill.name]}%`);
    const projectNames = [...new Set(employee.projects)];
    nodes.push({
      id: `employee:${employee.id}`,
      type: "twinEntity",
      position: { x: 0, y: 0 },
      style: sizeByKind.employee,
      data: {
        kind: "employee",
        title: employee.name,
        subtitle: employee.role,
        lines: [
          `Verified · ${verified.length ? verified.join(" · ") : "none at current threshold"}`,
          `${employee.workload}% workload · ${employee.availability}% available`,
          `Current projects · ${projectNames.join(" · ")}`,
        ],
        health: employee.workload > 85 ? "critical" : employee.availability < 25 ? "watch" : "healthy",
        onOpen: () => open({ kind: "employee", id: employee.id }),
      },
    });
  });

  model.skills.forEach(skill => {
    nodes.push({
      id: `skill:${skill.name}`,
      type: "twinEntity",
      position: { x: 0, y: 0 },
      style: sizeByKind.skill,
      data: {
        kind: "skill",
        title: skill.name,
        subtitle: `${skill.proficiency}% expert · ${skill.qualifiedEmployees.length} verified at ≥${skill.minimum}%`,
        lines: [
          `${skill.critical ? "Critical" : "Standard"} · ${skill.availableQualifiedBackups.length} qualified backups available`,
          `Primary expert · ${skill.owner.name}`,
        ],
        health: skill.health,
        onOpen: () => open({ kind: "skill", id: skill.name }),
      },
    });
  });

  model.tasks.forEach(task => {
    nodes.push({
      id: `task:${task.id}`,
      type: "twinEntity",
      position: { x: 0, y: 0 },
      style: sizeByKind.task,
      data: {
        kind: "task",
        title: task.title,
        subtitle: task.projectName,
        lines: [
          `Requires · ${task.requiredSkills.join(" · ")} ≥${task.minimumProficiency}%`,
          `${task.priority} priority · ${task.status}`,
          `Assigned · ${task.assignedEmployeeIds.map(id => model.employees.find(employee => employee.id === id)?.name ?? id).join(", ")}`,
        ],
        health: task.status === "At risk" ? "critical" : task.status === "Complete" ? "healthy" : "watch",
        onOpen: () => open({ kind: "task", id: task.id }),
      },
    });
  });

  model.projects.forEach(projectView => {
    nodes.push({
      id: `project:${projectView.project.id}`,
      type: "twinEntity",
      position: { x: 0, y: 0 },
      style: sizeByKind.project,
      data: {
        kind: "project",
        title: projectView.project.name,
        subtitle: `${projectView.project.deadline} · ${projectView.project.domain}`,
        lines: [
          `${projectView.risk} risk · ${projectView.continuity}% continuity`,
          `${projectView.backupCoverage}% critical backup coverage`,
          `${projectView.tasks.length} linked tasks · ${projectView.uncoveredSkills.length} uncovered skills`,
        ],
        health: projectView.risk === "Critical" ? "critical" : projectView.risk === "Medium" ? "watch" : "healthy",
        onOpen: () => open({ kind: "project", id: projectView.project.id }),
      },
    });
  });

  model.employees.forEach(employee => {
    Object.entries(employee.skills).forEach(([skillName, proficiency]) => {
      const skill = skillsByName.get(skillName);
      if (!skill) return;
      const meetsMinimum = proficiency >= skill.minimum;
      const health: TwinHealth = skill.critical && meetsMinimum && skill.qualifiedEmployees.length === 1
        ? "critical"
        : meetsMinimum ? "healthy" : "watch";
      edges.push(relationshipEdge(`possesses:${employee.id}:${skillName}`, `employee:${employee.id}`, `skill:${skillName}`, "possesses", health));
    });
  });

  model.tasks.forEach(task => {
    const taskHealth: TwinHealth = task.status === "At risk" ? "critical" : task.status === "Complete" ? "healthy" : "watch";
    task.assignedEmployeeIds.forEach(employeeId => {
      edges.push(relationshipEdge(`assigned:${employeeId}:${task.id}`, `employee:${employeeId}`, `task:${task.id}`, "assigned to", taskHealth));
    });
    edges.push(relationshipEdge(`belongs:${task.id}:${task.projectId}`, `task:${task.id}`, `project:${task.projectId}`, "belongs to", taskHealth));
    task.requiredSkills.forEach(skillName => {
      const skill = skillsByName.get(skillName);
      edges.push(relationshipEdge(`requires:${task.id}:${skillName}`, `task:${task.id}`, `skill:${skillName}`, "requires", skill?.health ?? "watch"));
    });
  });

  return { nodes, edges };
}

function riskLabel(health: TwinHealth) {
  if (health === "critical") return "Critical dependency";
  if (health === "watch") return "Needs attention";
  return "Healthy coverage";
}

function PersonChip({ employee, label }: { employee: Employee; label?: string }) {
  return <span className="twin-person-chip"><i>{employee.initials}</i><span><strong>{employee.name}</strong>{label && <small>{label}</small>}</span></span>;
}

function SkillRows({ skills }: { skills: TwinSkill[] }) {
  if (!skills.length) return <p className="twin-empty-note">No related skills were found.</p>;
  return <div className="twin-detail-skill-list">{skills.map(skill => <div className="twin-detail-skill" key={skill.id}><span><strong>{skill.name}</strong><small>{skill.proficiency}% expert · minimum {skill.minimum}%</small></span><span className={`twin-risk-label ${skill.health}`}>{skill.qualifiedEmployees.length} qualified</span></div>)}</div>;
}

function DetailPanel({
  selection,
  model,
  activeProject,
  scenario,
  recoveryApplied,
  onClose,
  onRunScenario,
  onOpenKnowledge,
  onAskCopilot,
}: {
  selection: TwinSelection | null;
  model: ReturnType<typeof buildWorkforceTwin>;
  activeProject: Project;
  scenario: ScenarioInput | null;
  recoveryApplied: boolean;
  onClose: () => void;
  onRunScenario: (employeeId: string) => void;
  onOpenKnowledge: () => void;
  onAskCopilot: (prompt: string) => void;
}) {
  if (!selection) return (
    <aside className="twin-detail-panel twin-detail-empty" aria-label="Workforce entity details">
      <div className="twin-detail-empty-icon"><Network size={22} /></div><span className="eyebrow">SELECT A NODE</span><h3>Make a dependency explorable.</h3><p>Choose an employee, skill, task or project in the network to see its evidence, risk and next best action.</p>
      <div className="twin-detail-hint"><CircleHelp size={15} />Search or use the accessible list to jump to a node.</div>
    </aside>
  );

  const task = selection.kind === "task" ? model.tasks.find(item => item.id === selection.id) : undefined;
  const skill = selection.kind === "skill" ? model.skills.find(item => item.name === selection.id) : undefined;
  const employee = selection.kind === "employee" ? model.employees.find(item => item.id === selection.id) : undefined;
  const projectView = selection.kind === "project" ? model.projects.find(item => item.project.id === selection.id) : undefined;

  const closeButton = <button className="twin-detail-close" onClick={onClose} aria-label="Close node details"><X size={16} /></button>;
  const section = (title: string, content: ReactNode) => <section className="twin-detail-section"><h4>{title}</h4>{content}</section>;

  if (skill) {
    const uniqueOwner = skill.critical && skill.qualifiedEmployees.length === 1;
    const backups = skill.availableQualifiedBackups;
    const dependents = skill.dependentTasks;
    const recommendedTraining = skill.trainingCandidates[0];
    const sourceRequirement = activeProject.requirements.find(requirement => requirement.skill === skill.name);
    const explanation = uniqueOwner
      ? `${skill.owner.name} is the only employee with verified ${skill.name} proficiency at or above ${skill.minimum}%. ${dependents.length} task${dependents.length === 1 ? "" : "s"} depend on this skill.`
      : `${skill.qualifiedEmployees.length} employees meet the verified proficiency threshold of ${skill.minimum}%.`;
    return <aside className="twin-detail-panel" aria-label={`${skill.name} skill details`}>
      <header className="twin-detail-header"><div><span className="eyebrow">SKILL DEPENDENCY</span><h3>{skill.name}</h3></div>{closeButton}</header>
      <span className={`twin-risk-banner ${skill.health}`}><span className="twin-status-mark" />{riskLabel(skill.health)}</span>
      <p className="twin-detail-explanation">{explanation}</p>
      <div className="twin-detail-kpis"><div><span>Proficiency</span><strong>{skill.proficiency}%</strong></div><div><span>Qualified</span><strong>{skill.qualifiedEmployees.length}</strong></div><div><span>Verified backups</span><strong>{backups.length}</strong></div></div>
      {section("Primary expert", <PersonChip employee={skill.owner} label={`${skill.proficiency}% · ${skill.owner.availability}% available`} />)}
      {section("Verified employees", <div className="twin-person-list">{skill.qualifiedEmployees.map(person => <PersonChip key={person.id} employee={person} label={`${person.skills[skill.name]}% verified`} />)}</div>)}
      {section("Qualified backups", backups.length ? <div className="twin-person-list">{backups.map(person => <PersonChip key={person.id} employee={person} label={`${person.skills[skill.name]}% · ${person.availability}% available`} />)}</div> : <p className="twin-empty-note">No verified, available backup currently meets ≥{skill.minimum}%. A trainee is not counted until verification is complete.</p>)}
      {section("Dependent tasks & projects", <div className="twin-dependent-list">{dependents.map(item => <div key={item.id}><FileText size={14} /><span><strong>{item.title}</strong><small>{item.projectName} · {item.priority} · {item.status}</small></span></div>)}{skill.dependentProjects.map(item => <div key={item.id}><Building2 size={14} /><span><strong>{item.name}</strong><small>{item.deadline} · project dependency</small></span></div>)}</div>)}
      {recommendedTraining && section("Training candidate · not a backup", <div className="twin-training-candidate"><PersonChip employee={recommendedTraining.employee} label={`${recommendedTraining.current}% now · ${recommendedTraining.employee.availability}% available`} /><p>Projected after training: <strong>{recommendedTraining.projected}%</strong> {recommendedTraining.projected >= skill.minimum ? `(target ≥${skill.minimum}%, then verify a real task)` : `(still below ≥${skill.minimum}%; training alone does not qualify)`}</p><small>Suggested course · {getSuggestedCourse(skill.name)}</small></div>)}
      <div className="twin-recommendation"><span><GraduationCap size={15} />Recommended action</span><p>{uniqueOwner ? `${recommendedTraining?.employee.name ?? "A second expert"}: schedule mentor-led ${skill.name} training, transfer the runbook, and verify a real task. Until then, redistribute critical tasks away from the single owner.` : `Keep ${skill.name} knowledge current and document the handover path.`}</p></div>
      <div className="twin-detail-actions"><button className="twin-action-primary" onClick={() => onRunScenario(skill.owner.id)}><Activity size={14} />Stress-test owner</button><button className="twin-action-secondary" onClick={onOpenKnowledge}><GitBranch size={14} />Transfer plan</button><button className="twin-action-link" onClick={() => onAskCopilot(`Explain the ${skill.name} dependency`)}><CircleHelp size={14} />Ask Copilot</button></div>
      {sourceRequirement && <small className="twin-source-note">Threshold from active project · {activeProject.client} · {sourceRequirement.minimum}% minimum</small>}
      {scenario && <small className="twin-source-note">Current simulation: {scenario.type} · {scenario.days} days · {recoveryApplied ? "hypothetical recovery applied; source roster unchanged" : "baseline before recovery"}</small>}
    </aside>;
  }

  if (employee) {
    const verifiedSkills = model.skills.filter(item => item.qualifiedEmployees.some(person => person.id === employee.id));
    const uniqueSkills = model.skills.filter(item => item.critical && item.qualifiedEmployees.length === 1 && item.owner.id === employee.id);
    const assignedTasks = model.tasks.filter(item => item.assignedEmployeeIds.includes(employee.id));
    const currentProjects = [...new Set([...employee.projects, ...model.projects.filter(item => item.project.teamIds.includes(employee.id)).map(item => item.project.client)])];
    const atRiskProjects = model.projects.filter(item => item.project.requirements.some(requirement => requirement.critical && requirement.ownerId === employee.id && model.skills.some(skillItem => skillItem.name === requirement.skill && skillItem.qualifiedEmployees.length === 1)));
    const backups = uniqueSkills.flatMap(item => item.availableQualifiedBackups);
    const nearestTraining = uniqueSkills.map(item => ({ skill: item, candidate: item.trainingCandidates[0] })).filter(item => item.candidate);
    return <aside className="twin-detail-panel" aria-label={`${employee.name} employee details`}>
      <header className="twin-detail-header"><div><span className="eyebrow">WORKFORCE PASSPORT</span><h3>{employee.name}</h3></div>{closeButton}</header>
      <div className="twin-person-hero"><i>{employee.initials}</i><div><strong>{employee.role}</strong><span>{employee.department} · {employee.experienceYears} years</span></div></div>
      <div className="twin-detail-kpis"><div><span>Workload</span><strong>{employee.workload}%</strong></div><div><span>Availability</span><strong>{employee.availability}%</strong></div><div><span>Verified skills</span><strong>{verifiedSkills.length}</strong></div></div>
      {section("Verified skills", <SkillRows skills={verifiedSkills} />)}
      {section("Current projects", <div className="twin-chip-row">{currentProjects.map(name => <span className="twin-chip" key={name}>{name}</span>)}</div>)}
      {section("Assigned tasks", assignedTasks.length ? <div className="twin-dependent-list">{assignedTasks.map(item => <div key={item.id}><FileText size={14} /><span><strong>{item.title}</strong><small>{item.projectName} · {item.status}</small></span></div>)}</div> : <p className="twin-empty-note">No seeded task assignments.</p>)}
      {section("Unique critical skills", uniqueSkills.length ? <div className="twin-chip-row">{uniqueSkills.map(item => <span className="twin-chip critical" key={item.id}>{item.name} · sole verified expert</span>)}</div> : <p className="twin-empty-note">No single-owner critical skill is assigned to this employee.</p>)}
      {section("Projects at risk if unavailable", atRiskProjects.length ? <div className="twin-chip-row">{atRiskProjects.map(item => <span className="twin-chip critical" key={item.project.id}>{item.project.client} · {item.risk}</span>)}</div> : <p className="twin-empty-note">No current project is uniquely dependent on this employee.</p>)}
      {section("Qualified backup employees", backups.length ? <div className="twin-person-list">{backups.map(person => <PersonChip key={person.id} employee={person} label="verified backup" />)}</div> : <p className="twin-empty-note">No verified backup for this employee's sole-owner skills.</p>)}
      {nearestTraining.length > 0 && section("Training candidates · not yet qualified", <div className="twin-dependent-list">{nearestTraining.map(item => <div key={item.skill.id}><GraduationCap size={14} /><span><strong>{item.candidate?.employee.name} · {item.skill.name}</strong><small>{item.candidate?.current}% now; {item.candidate?.projected}% projected after training; not counted until verified</small></span></div>)}</div>)}
      <div className="twin-recommendation"><span><ShieldAlert size={15} />Risk-reduction actions</span><p>{uniqueSkills.length ? `Protect ${uniqueSkills.map(item => item.name).join(" and ")} with a mentor-led handover, a verified backup and a temporary redistribution plan.` : "Keep project context, task ownership and verified skill evidence current."}</p></div>
      <div className="twin-detail-actions"><button className="twin-action-primary" onClick={() => onRunScenario(employee.id)}><Activity size={14} />Simulate unavailability</button>{nearestTraining.length > 0 && <button className="twin-action-secondary" onClick={onOpenKnowledge}><GitBranch size={14} />Plan transfer</button>}</div>
      {isEmployeeUnavailable(employee, scenario) && <small className="twin-source-note">Excluded from the active scenario · source workforce record remains unchanged.</small>}
    </aside>;
  }

  if (task) {
    const assigned = task.assignedEmployeeIds.map(id => model.employees.find(person => person.id === id)).filter((person): person is Employee => Boolean(person));
    const skills = task.requiredSkills.map(name => model.skills.find(item => item.name === name)).filter((item): item is TwinSkill => Boolean(item));
    return <aside className="twin-detail-panel" aria-label={`${task.title} task details`}>
      <header className="twin-detail-header"><div><span className="eyebrow">PROJECT TASK</span><h3>{task.title}</h3></div>{closeButton}</header>
      <span className={`twin-risk-banner ${task.status === "At risk" ? "critical" : task.status === "Complete" ? "healthy" : "watch"}`}><span className="twin-status-mark" />{task.status} · {task.priority} priority</span>
      <p className="twin-detail-explanation">{task.description}</p>
      <div className="twin-detail-kpis"><div><span>Required skills</span><strong>{task.requiredSkills.length}</strong></div><div><span>Threshold</span><strong>≥{task.minimumProficiency}%</strong></div><div><span>Owner</span><strong>{assigned[0]?.name.split(" ")[0] ?? "Unassigned"}</strong></div></div>
      {section("Assigned employees", <div className="twin-person-list">{assigned.map(person => <PersonChip key={person.id} employee={person} label={`${person.skills[task.requiredSkills[0]] ?? 0}% verified`} />)}</div>)}
      {section("Requires", <SkillRows skills={skills} />)}
      {section("Belongs to project", <div className="twin-dependent-list"><div><Building2 size={14} /><span><strong>{task.projectName}</strong><small>{task.projectClient}</small></span></div></div>)}
      {task.status === "At risk" && <div className="twin-recommendation"><span><AlertTriangle size={15} />Recovery action</span><p>Confirm an available verified backup for {task.requiredSkills.join(", ")}, record the runbook and schedule a supervised verification task.</p></div>}
      <div className="twin-detail-actions"><button className="twin-action-primary" onClick={() => onRunScenario(assigned[0]?.id ?? "rahul")}><Activity size={14} />Stress-test owner</button><button className="twin-action-link" onClick={() => onAskCopilot(`Explain the risk for ${task.title}`)}><CircleHelp size={14} />Ask Copilot</button></div>
    </aside>;
  }

  if (projectView) {
    const requirements = getSkillInventory(false, projectView.project, model.employees);
    const projectTaskOwners = [...new Map(projectView.tasks.flatMap(item => item.assignedEmployeeIds.map(id => model.employees.find(person => person.id === id))).filter((person): person is Employee => Boolean(person)).map(person => [person.id, person])).values()];
    const projectSkillRows = requirements.flatMap(requirement => {
      const modelSkill = model.skills.find(item => item.name === requirement.skill);
      if (!modelSkill) return [];
      const qualifiedEmployees = model.employees.filter(person => (person.skills[requirement.skill] ?? 0) >= requirement.minimum);
      const owner = model.employees.find(person => person.id === requirement.ownerId) ?? modelSkill.owner;
      return [{ ...modelSkill, minimum: requirement.minimum, proficiency: owner.skills[requirement.skill] ?? 0, qualifiedEmployees, owner }];
    });
    const criticalSkillCount = requirements.filter(item => item.critical).length;
    const verifiedBackupCoverage = criticalSkillCount ? Math.round(projectView.verifiedBackupSkills.length / criticalSkillCount * 100) : 100;
    const hasRecoveryProjection = Boolean(scenario && projectView.project.id === activeProject.id && recoveryApplied && ["absence", "resignation", "unavailable"].includes(scenario.type) && projectView.project.requirements.some(requirement => requirement.critical && requirement.ownerId === scenario.employeeId));
    return <aside className="twin-detail-panel" aria-label={`${projectView.project.name} project details`}>
      <header className="twin-detail-header"><div><span className="eyebrow">PROJECT CONTINUITY</span><h3>{projectView.project.name}</h3></div>{closeButton}</header>
      <span className={`twin-risk-banner ${projectView.risk === "Critical" ? "critical" : projectView.risk === "Medium" ? "watch" : "healthy"}`}><span className="twin-status-mark" />{projectView.risk} risk · {projectView.project.priority} priority</span>
      <p className="twin-detail-explanation">{projectView.project.description}</p>
      <div className="twin-detail-kpis"><div><span>Continuity</span><strong>{projectView.continuity}/100</strong></div><div><span>Readiness</span><strong>{projectView.readiness}/100</strong></div><div><span>Deadline</span><strong>{projectView.project.deadline}</strong></div></div>
      {section("Required skills & task dependencies", <><SkillRows skills={projectSkillRows} /><div className="twin-dependent-list twin-task-sublist">{projectView.tasks.map(item => <div key={item.id}><FileText size={14} /><span><strong>{item.title}</strong><small>{item.requiredSkills.join(", ")} · {item.status}</small></span></div>)}</div></>)}
      {section("Critical employees", projectView.criticalEmployees.length ? <div className="twin-person-list">{projectView.criticalEmployees.map(person => <PersonChip key={person.id} employee={person} label="sole expert for a critical skill" />)}</div> : <p className="twin-empty-note">No single-person critical skill is currently detected.</p>)}
      {section("Uncovered skills", projectView.uncoveredSkills.length ? <div className="twin-chip-row">{projectView.uncoveredSkills.map(name => <span className="twin-chip critical" key={name}>{name}</span>)}</div> : <p className="twin-empty-note">All required skills have at least one qualified owner.</p>)}
      {section("Qualified backup coverage", <><p className="twin-coverage-copy">{projectView.verifiedBackupSkills.length} of {criticalSkillCount} critical skills currently have two available, verified employees · {verifiedBackupCoverage}% verified coverage.</p>{hasRecoveryProjection && <small className="twin-source-note">Hypothetical team recovery projection: {projectView.backupCoverage}% under {recoveryStrategy}. Training candidates remain separate from verified backups until they pass a real skill check.</small>}</>)}
      <div className="twin-recommendation"><span><Workflow size={15} />Recommended recovery plan</span><p>{projectView.criticalEmployees.length ? `Pair ${projectView.criticalEmployees[0].name} with a verified learner, redistribute near-term tasks and require a completed skill check before counting a backup.` : "Maintain handover notes and rebalance work before deadline pressure builds."}</p></div>
      {projectTaskOwners.length > 0 && section("Current task owners", <div className="twin-person-list">{projectTaskOwners.map(person => <PersonChip key={person.id} employee={person} label={`${person.workload}% workload`} />)}</div>)}
      <div className="twin-detail-actions"><button className="twin-action-primary" onClick={() => onRunScenario(projectView.criticalEmployees[0]?.id ?? projectTaskOwners[0]?.id ?? "rahul")}><Activity size={14} />Run project scenario</button><button className="twin-action-link" onClick={() => onAskCopilot(`Brief me on ${projectView.project.client} continuity`)}><CircleHelp size={14} />Ask Copilot</button></div>
    </aside>;
  }
  return null;
}

export default function WorkforceTwin({ activeProject, employees, scenario, recoveryApplied, recoveryStrategy, onRunScenario, onOpenKnowledge, onAskCopilot }: WorkforceTwinProps) {
  const model = useMemo(() => buildWorkforceTwin(activeProject, employees, scenario, recoveryApplied, recoveryStrategy), [activeProject, employees, scenario, recoveryApplied, recoveryStrategy]);
  const [selection, setSelection] = useState<TwinSelection | null>(null);
  const initialSelectionDone = useRef(false);
  const [flowInitVersion, setFlowInitVersion] = useState(0);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"graph" | "list">("graph");
  const [layoutVersion, setLayoutVersion] = useState(0);
  const flowRef = useRef<ReactFlowInstance<FlowNode, FlowEdge> | null>(null);
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);

  const openEntity = useCallback((next: TwinSelection) => setSelection(next), []);
  const baseGraph = useMemo(() => createGraph(model, openEntity), [model, openEntity]);

  useEffect(() => {
    setFlowNodes(autoLayout(baseGraph.nodes, baseGraph.edges));
    setFlowEdges(baseGraph.edges);
  }, [baseGraph, layoutVersion, setFlowNodes, setFlowEdges]);

  useEffect(() => {
    if (!model.skills.length) return;
    if (!selection && initialSelectionDone.current) return;
    const selectedStillExists = selection && (
      selection.kind === "employee" ? model.employees.some(person => person.id === selection.id)
        : selection.kind === "skill" ? model.skills.some(skill => skill.name === selection.id)
          : selection.kind === "task" ? model.tasks.some(task => task.id === selection.id)
            : model.projects.some(project => project.project.id === selection.id)
    );
    if (selectedStillExists) { initialSelectionDone.current = true; return; }
    const firstFailure = model.skills.find(skill => skill.name.toLowerCase() === "cybersecurity" && skill.critical && skill.qualifiedEmployees.length === 1)
      ?? model.skills.find(skill => skill.critical && skill.qualifiedEmployees.length === 1)
      ?? model.skills[0];
    initialSelectionDone.current = true;
    setSelection(firstFailure ? { kind: "skill", id: firstFailure.name } : null);
  }, [model, selection]);

  useEffect(() => {
    if (!flowRef.current || !flowNodes.length) return;
    const criticalSkill = model.skills.find(skill => skill.name.toLowerCase() === "cybersecurity" && skill.critical && skill.qualifiedEmployees.length === 1)
      ?? model.skills.find(skill => skill.critical && skill.qualifiedEmployees.length === 1);
    const target = selection ?? (criticalSkill ? { kind: "skill" as const, id: criticalSkill.name } : null);
    const node = target && flowNodes.find(candidate => candidate.id === `${target.kind}:${target.id}`);
    if (!node) return;
    const size = sizeByKind[target.kind];
    const instance = flowRef.current;
    requestAnimationFrame(() => instance.setCenter(node.position.x + size.width / 2, node.position.y + size.height / 2, { zoom: 0.85, duration: 350 }));
  }, [flowInitVersion, flowNodes.length, model, selection, baseGraph, layoutVersion]);

  const nodeIdFor = (item: TwinSelection) => `${item.kind}:${item.id}`;
  const openAndFocus = (item: TwinSelection) => {
    setSelection(item);
    const node = flowNodes.find(candidate => candidate.id === nodeIdFor(item));
    if (node) {
      const size = sizeByKind[item.kind];
      flowRef.current?.setCenter(node.position.x + size.width / 2, node.position.y + size.height / 2, { zoom: 0.85, duration: 450 });
    }
  };
  const matches = (node: FlowNode) => {
    const query = search.trim().toLowerCase();
    return Boolean(query && `${node.data.title} ${node.data.subtitle} ${node.data.lines.join(" ")}`.toLowerCase().includes(query));
  };
  const matchingNodeIds = new Set(flowNodes.filter(matches).map(node => node.id));
  const selectedNodeId = selection ? nodeIdFor(selection) : "";
  const visibleNodes = flowNodes.map(node => ({
    ...node,
    className: `twin-flow-node ${node.data.health} ${node.id === selectedNodeId ? "selected" : ""} ${matchingNodeIds.size && !matchingNodeIds.has(node.id) ? "dimmed" : matchingNodeIds.has(node.id) ? "search-match" : ""}`,
  }));
  const visibleEdges = flowEdges.map(edge => {
    const relatedToSelection = edge.source === selectedNodeId || edge.target === selectedNodeId;
    const relatedToSearch = matchingNodeIds.has(edge.source) || matchingNodeIds.has(edge.target);
    const dim = Boolean(matchingNodeIds.size && !relatedToSearch) || Boolean(selectedNodeId && !relatedToSelection && !matchingNodeIds.size);
    const color = edge.data ? healthColor[edge.data.health] : healthColor.watch;
    return {
      ...edge,
      style: { ...edge.style, opacity: dim ? 0.12 : relatedToSelection || relatedToSearch ? 0.95 : 0.64, strokeWidth: relatedToSelection || relatedToSearch ? 2.35 : edge.style?.strokeWidth },
      labelStyle: { ...edge.labelStyle, opacity: dim ? 0.12 : 1, fill: color },
      markerEnd: { type: MarkerType.ArrowClosed, color },
    };
  });
  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return flowNodes.filter(node => `${node.data.title} ${node.data.subtitle} ${node.data.lines.join(" ")}`.toLowerCase().includes(query)).slice(0, 7);
  }, [flowNodes, search]);
  const fitGraph = () => flowRef.current?.fitView({ padding: 0.18, duration: 450 });

  return (
    <section className="workforce-twin" aria-label="Workforce digital twin">
      <div className="twin-intro-banner"><div className="twin-intro-icon"><Network size={19} /></div><div><span className="eyebrow">ORGANIZATION DIGITAL TWIN</span><strong>See the knowledge paths behind every project.</strong><p>Explore {model.employees.length} employees, {model.skills.length} skills, {model.tasks.length} tasks and {model.projects.length} connected projects. Select a node to inspect verified capability and risk.</p></div><span className="twin-live-tag"><span className="twin-status-mark healthy" />LIVE MODEL</span></div>
      <div className="twin-toolbar panel">
        <div className="twin-search-wrap"><Search size={16} /><input aria-label="Search employees, skills, tasks and projects" placeholder="Search people, skills, tasks or projects…" value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && searchResults[0]) openAndFocus({ kind: searchResults[0].data.kind, id: searchResults[0].data.kind === "skill" ? searchResults[0].data.title : searchResults[0].id.split(":").slice(1).join(":") }); }} />{search && <button onClick={() => setSearch("")} aria-label="Clear graph search"><X size={14} /></button>}
          {searchResults.length > 0 && <div className="twin-search-results" role="listbox" aria-label="Matching graph entities">{searchResults.map(node => <button key={node.id} role="option" aria-selected={node.id === selectedNodeId} onClick={() => openAndFocus({ kind: node.data.kind, id: node.data.kind === "skill" ? node.data.title : node.id.split(":").slice(1).join(":") })}><span className={`twin-search-icon ${node.data.kind}`}><Search size={13} /></span><span><strong>{node.data.title}</strong><small>{kindLabel[node.data.kind]} · {node.data.subtitle}</small></span></button>)}</div>}
        </div>
        <div className="twin-toolbar-actions"><div className="twin-view-toggle" role="group" aria-label="Network display mode"><button className={view === "graph" ? "selected" : ""} onClick={() => setView("graph")} aria-pressed={view === "graph"}><Network size={14} />Graph</button><button className={view === "list" ? "selected" : ""} onClick={() => setView("list")} aria-pressed={view === "list"}><List size={14} />List</button></div><button className="twin-toolbar-button" onClick={fitGraph} aria-label="Fit graph to screen"><Maximize2 size={14} /><span>Fit</span></button><button className="twin-toolbar-button" onClick={() => setLayoutVersion(version => version + 1)} aria-label="Restore automatic graph layout"><Workflow size={14} /><span>Auto layout</span></button></div>
      </div>
      <div className="twin-legend" aria-label="Network legend"><span><i className="twin-legend-line healthy" />Healthy</span><span><i className="twin-legend-line watch" />Potential risk</span><span><i className="twin-legend-line critical" />Critical / sole verified expert</span><span className="twin-legend-note">Drag to rearrange · scroll or controls to zoom · drag canvas to pan</span></div>
      <div className="twin-workspace">
        <div className={`twin-graph-frame ${view === "list" ? "list-mode" : ""}`}>
          {view === "graph" ? <ReactFlow<FlowNode, FlowEdge>
            nodes={visibleNodes}
            edges={visibleEdges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onInit={instance => { flowRef.current = instance; setFlowInitVersion(version => version + 1); }}
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable
            minZoom={0.08}
            maxZoom={1.5}
            panOnDrag
            zoomOnScroll
            zoomOnDoubleClick={false}
            proOptions={{ hideAttribution: true }}
            aria-label="Interactive organization dependency graph"
          ><Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="#d8cfbf" /><Controls showInteractive={false} position="bottom-left" /><MiniMap position="bottom-right" pannable zoomable nodeColor={node => healthColor[(node.data as TwinNodeData).health]} /></ReactFlow> : <div className="twin-accessible-list" role="list" aria-label="Accessible workforce entity list">{flowNodes.filter(node => !search || matches(node)).map(node => <button className={`twin-list-row ${node.data.health}`} key={node.id} role="listitem" onClick={() => openAndFocus({ kind: node.data.kind, id: node.data.kind === "skill" ? node.data.title : node.id.split(":").slice(1).join(":") })}><span className={`twin-list-kind ${node.data.kind}`}>{kindLabel[node.data.kind]}</span><span><strong>{node.data.title}</strong><small>{node.data.subtitle} · {node.data.lines.join(" · ")}</small></span><ChevronRight size={15} /></button>)}</div>}
        </div>
        <DetailPanel selection={selection} model={model} activeProject={activeProject} scenario={scenario} recoveryApplied={recoveryApplied} onClose={() => setSelection(null)} onRunScenario={onRunScenario} onOpenKnowledge={onOpenKnowledge} onAskCopilot={onAskCopilot} />
      </div>
      <div className="twin-graph-footnote"><BadgeCheck size={14} /><span>Verified means proficiency meets the active project threshold. Training candidates remain separate until a real task is completed and verified.</span></div>
    </section>
  );
}
