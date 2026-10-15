export type ScenarioType =
  | "absence"
  | "resignation"
  | "workload"
  | "deadline"
  | "new-project"
  | "unavailable";
export type RecoveryStrategy = "cross-train" | "redistribute";

export type RiskLevel = "Low" | "Medium" | "Critical";

export interface Employee {
  id: string;
  name: string;
  initials: string;
  role: string;
  department: string;
  workload: number;
  availability: number;
  experienceYears: number;
  domainExperience: number;
  collaboration: number;
  skills: Record<string, number>;
  certifications: string[];
  training: string[];
  projects: string[];
  backupReady: string[];
  mentorReady?: string[];
}

export interface SkillRequirement {
  skill: string;
  minimum: number;
  critical: boolean;
  ownerId: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  description: string;
  domain: string;
  deadline: string;
  weeksRemaining: number;
  priority: "High" | "Medium" | "Low";
  teamSize: number;
  requirements: SkillRequirement[];
  teamIds: string[];
}

export interface ScenarioInput {
  type: ScenarioType;
  employeeId: string;
  days: number;
}

export interface ContinuityFactors {
  skillCoverage: number;
  backupCoverage: number;
  workloadSafety: number;
  availability: number;
  knowledgeDistribution: number;
}

export interface ScenarioMetrics {
  readiness: number;
  continuity: number;
  factors: ContinuityFactors;
  deadlineFeasibility: number;
  cybersecurityCoverage: number;
  expectedDelayDays: number;
  risk: RiskLevel;
  impactedSkill: string;
  evidence: string;
}

export const EMPLOYEES: Employee[] = [
  {
    id: "arjun",
    name: "Arjun Mehta",
    initials: "AM",
    role: "Cloud & Data Engineer",
    department: "Engineering",
    workload: 65,
    availability: 35,
    experienceYears: 7,
    domainExperience: 91,
    collaboration: 88,
    skills: { Python: 94, AWS: 92 },
    certifications: ["AWS Solutions Architect", "Python Institute PCAP"],
    training: ["Healthcare data privacy"],
    projects: ["CareLens Analytics", "Claims modernization"],
    backupReady: ["Python"],
    mentorReady: ["Python", "AWS"],
  },
  {
    id: "meera",
    name: "Meera Iyer",
    initials: "MI",
    role: "Frontend Engineer",
    department: "Product Engineering",
    workload: 45,
    availability: 55,
    experienceYears: 5,
    domainExperience: 84,
    collaboration: 92,
    skills: { React: 94, UI: 91 },
    certifications: ["Accessibility fundamentals"],
    training: ["Design systems"],
    projects: ["CareLens Analytics", "Member portal"],
    backupReady: ["React"],
    mentorReady: ["React", "UI"],
  },
  {
    id: "rahul",
    name: "Rahul Menon",
    initials: "RM",
    role: "Security Architect",
    department: "Security",
    workload: 70,
    availability: 30,
    experienceYears: 8,
    domainExperience: 94,
    collaboration: 86,
    skills: { Cybersecurity: 97 },
    certifications: ["CISSP", "AWS Security Specialty"],
    training: ["Threat modeling"],
    projects: ["CareLens Analytics", "Identity hardening"],
    backupReady: ["Security architecture"],
    mentorReady: ["Cybersecurity", "Security architecture"],
  },
  {
    id: "kavya",
    name: "Kavya Rao",
    initials: "KR",
    role: "Analytics Engineer",
    department: "Data & Insights",
    workload: 40,
    availability: 60,
    experienceYears: 5,
    domainExperience: 88,
    collaboration: 90,
    skills: { SQL: 93, Python: 88 },
    certifications: ["dbt Analytics Engineering"],
    training: ["Healthcare data modeling"],
    projects: ["CareLens Analytics", "Quality reporting"],
    backupReady: ["SQL", "Python"],
    mentorReady: ["SQL", "Python"],
  },
  {
    id: "aisha",
    name: "Aisha Khan",
    initials: "AK",
    role: "Platform Engineer",
    department: "Engineering",
    workload: 30,
    availability: 70,
    experienceYears: 3,
    domainExperience: 72,
    collaboration: 93,
    skills: { AWS: 68, Docker: 84 },
    certifications: ["Docker Foundations"],
    training: ["Cloud operations"],
    projects: ["Platform reliability"],
    backupReady: ["Docker"],
    mentorReady: ["AWS basics", "Docker"],
  },
  {
    id: "priya",
    name: "Priya Shah",
    initials: "PS",
    role: "Senior Data Scientist",
    department: "Data & Insights",
    workload: 90,
    availability: 10,
    experienceYears: 9,
    domainExperience: 92,
    collaboration: 79,
    skills: { Python: 99, Analytics: 96 },
    certifications: ["Google Professional Data Engineer"],
    training: ["Clinical analytics"],
    projects: ["CareLens Analytics", "Population health"],
    backupReady: ["Analytics"],
  },
  {
    id: "vikram", name: "Vikram Iyer", initials: "VI", role: "Clinical Data Analyst", department: "Clinical Systems",
    workload: 54, availability: 46, experienceYears: 6, domainExperience: 92, collaboration: 88,
    skills: { FHIR: 88, "Healthcare reporting": 91, SQL: 72 }, certifications: ["FHIR Fundamentals"], training: ["Claims analytics"], projects: ["Clinical data exchange"], backupReady: ["Healthcare reporting"],
  },
  {
    id: "leena", name: "Leena Patel", initials: "LP", role: "Quality Engineering Lead", department: "Quality Engineering",
    workload: 62, availability: 38, experienceYears: 7, domainExperience: 78, collaboration: 91,
    skills: { QA: 94, "Test automation": 92, React: 72 }, certifications: ["ISTQB Advanced"], training: ["Accessibility testing"], projects: ["Member portal"], backupReady: ["Test automation"],
  },
  {
    id: "omar", name: "Omar Khan", initials: "OK", role: "DevOps Engineer", department: "Platform",
    workload: 58, availability: 42, experienceYears: 5, domainExperience: 70, collaboration: 86,
    skills: { DevOps: 91, Kubernetes: 88, AWS: 78 }, certifications: ["CKA"], training: ["Cloud reliability"], projects: ["Platform reliability"], backupReady: ["Kubernetes"],
  },
  {
    id: "nisha", name: "Nisha Bose", initials: "NB", role: "Product Data Analyst", department: "Product",
    workload: 48, availability: 52, experienceYears: 4, domainExperience: 85, collaboration: 93,
    skills: { "Product analytics": 89, SQL: 79, Python: 70 }, certifications: ["Product Analytics"], training: ["Experiment design"], projects: ["Member portal"], backupReady: ["Product analytics"], mentorReady: ["Product analytics"],
  },
  {
    id: "dev", name: "Dev Shah", initials: "DS", role: "UX Researcher", department: "Product Design",
    workload: 52, availability: 48, experienceYears: 5, domainExperience: 81, collaboration: 95,
    skills: { "UX research": 94, UI: 79, React: 76 }, certifications: ["Human-centred design"], training: ["Healthcare accessibility"], projects: ["Member portal"], backupReady: ["UX research"],
  },
  {
    id: "tessa", name: "Tessa Roy", initials: "TR", role: "Data Governance Analyst", department: "Security",
    workload: 68, availability: 32, experienceYears: 8, domainExperience: 89, collaboration: 82,
    skills: { "Data governance": 93, Privacy: 90, SQL: 77, Cybersecurity: 73 }, certifications: ["Certified Information Privacy Professional"], training: ["Healthcare privacy"], projects: ["Data governance uplift"], backupReady: ["Privacy"],
  },
  {
    id: "marcus", name: "Marcus Lee", initials: "ML", role: "Data Engineer", department: "Data & Insights",
    workload: 74, availability: 26, experienceYears: 8, domainExperience: 82, collaboration: 87,
    skills: { "Data engineering": 94, ETL: 95, Python: 79 }, certifications: ["Databricks Data Engineer"], training: ["Streaming pipelines"], projects: ["Claims modernization"], backupReady: ["ETL"],
  },
  {
    id: "rohan", name: "Rohan Das", initials: "RD", role: "Clinical Informatics Specialist", department: "Clinical Systems",
    workload: 43, availability: 57, experienceYears: 9, domainExperience: 96, collaboration: 89,
    skills: { FHIR: 95, "Clinical informatics": 92, AWS: 62 }, certifications: ["HL7 FHIR Practitioner"], training: ["Interoperability standards"], projects: ["Clinical data exchange", "Quality reporting"], backupReady: ["FHIR"],
  },
  {
    id: "fatima", name: "Fatima Ali", initials: "FA", role: "Privacy & Risk Analyst", department: "Security",
    workload: 57, availability: 43, experienceYears: 6, domainExperience: 93, collaboration: 91,
    skills: { "Security governance": 90, Privacy: 94, Cybersecurity: 75 }, certifications: ["Healthcare Privacy and Security"], training: ["Risk assessment"], projects: ["Identity hardening"], backupReady: ["Privacy"],
  },
  {
    id: "elaine", name: "Elaine Chen", initials: "EC", role: "ML Operations Engineer", department: "Data & Insights",
    workload: 66, availability: 34, experienceYears: 6, domainExperience: 79, collaboration: 90,
    skills: { "ML operations": 93, Monitoring: 89, Python: 78 }, certifications: ["MLflow Professional"], training: ["Model observability"], projects: ["Risk model refresh"], backupReady: ["Monitoring"],
  },
  {
    id: "noah", name: "Noah Kim", initials: "NK", role: "Data Quality Engineer", department: "Quality Engineering",
    workload: 39, availability: 61, experienceYears: 4, domainExperience: 74, collaboration: 94,
    skills: { "Data quality": 92, SQL: 77, AWS: 79 }, certifications: ["Great Expectations Practitioner"], training: ["Pipeline validation"], projects: ["Claims modernization"], backupReady: ["Data quality"], mentorReady: ["Data quality"],
  },
  {
    id: "ishan", name: "Ishan Kapoor", initials: "IK", role: "Product Designer", department: "Product Design",
    workload: 59, availability: 41, experienceYears: 5, domainExperience: 77, collaboration: 92,
    skills: { "UX design": 91, UI: 87, React: 78 }, certifications: ["Design systems"], training: ["Accessible interfaces"], projects: ["Member portal"], backupReady: ["UI"],
  },
  {
    id: "sofia", name: "Sofia Rao", initials: "SR", role: "Business Analyst", department: "Product",
    workload: 47, availability: 53, experienceYears: 6, domainExperience: 88, collaboration: 90,
    skills: { "Business analysis": 93, "Healthcare reporting": 86, SQL: 69 }, certifications: ["Business Analysis Professional"], training: ["Clinical operations"], projects: ["Quality reporting"], backupReady: ["Business analysis"],
  },
  {
    id: "gabriel", name: "Gabriel Chen", initials: "GC", role: "Program Delivery Manager", department: "Delivery",
    workload: 72, availability: 28, experienceYears: 10, domainExperience: 84, collaboration: 96,
    skills: { "Program delivery": 95, "Capacity planning": 88, AWS: 74 }, certifications: ["PMP"], training: ["Agile portfolio planning"], projects: ["Claims modernization", "Data governance uplift"], backupReady: ["Capacity planning"],
  },
];

export const PROJECT: Project = {
  id: "carelens",
  name: "Healthcare Analytics Platform",
  client: "CareLens Analytics",
  description:
    "Build a secure healthcare analytics platform for clinical and claims insights, with trusted data pipelines and a responsive experience.",
  domain: "Healthcare",
  deadline: "8 weeks",
  weeksRemaining: 8,
  priority: "High",
  teamSize: 4,
  requirements: [
    { skill: "Python", minimum: 80, critical: false, ownerId: "arjun" },
    { skill: "AWS", minimum: 80, critical: true, ownerId: "arjun" },
    { skill: "Cybersecurity", minimum: 80, critical: true, ownerId: "rahul" },
    { skill: "SQL", minimum: 80, critical: true, ownerId: "kavya" },
    { skill: "React", minimum: 80, critical: true, ownerId: "meera" },
  ],
  teamIds: ["arjun", "meera", "rahul", "kavya"],
};

export const RECOVERY_TEAM_IDS = ["arjun", "meera", "rahul", "kavya", "aisha"];

export const DEMO_PROMPTS = [
  "What breaks if Rahul is absent?",
  "Find the safest backup",
  "Explain this risk",
  "Create a manager briefing",
  "Create a knowledge-transfer plan",
];

export const RECOVERY_STEPS = [
  { week: "Week 1 · Session 1", title: "Security architecture walkthrough", owner: "Rahul → Aisha", status: "Ready to schedule" },
  { week: "Week 1 · Session 2", title: "Threat-modeling on the CareLens data flow", owner: "Rahul → Aisha", status: "Ready to schedule" },
  { week: "Week 2 · Session 3", title: "Practical security code review", owner: "Rahul → Aisha", status: "Ready to schedule" },
  { week: "Week 2 · Session 4", title: "Aisha completes and verifies a security task", owner: "Aisha · Rahul reviews", status: "Verification gate" },
];

export const CONTINUITY_WEIGHT_LABELS = [
  { key: "skillCoverage", label: "Skill coverage", weight: 30, formula: "Required project skills covered at the minimum proficiency threshold." },
  { key: "backupCoverage", label: "Backup coverage", weight: 20, formula: "Critical skills with at least two capable employees ÷ all critical skills." },
  { key: "workloadSafety", label: "Workload safety", weight: 20, formula: "Team capacity reserve after workload redistribution; >85% individual load is unsafe." },
  { key: "availability", label: "Availability", weight: 15, formula: "Available capacity during the project window, including the simulated absence." },
  { key: "knowledgeDistribution", label: "Knowledge distribution", weight: 15, formula: "Critical skills shared through a qualified backup or verified handover." },
] as const;

export const EMPLOYEE_SCORE_WEIGHTS = [
  { label: "Skill match", weight: 35 },
  { label: "Availability", weight: 20 },
  { label: "Experience", weight: 15 },
  { label: "Workload safety", weight: 15 },
  { label: "Domain experience", weight: 10 },
  { label: "Collaboration history", weight: 5 },
] as const;

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function scoreContinuity(factors: ContinuityFactors): number {
  return Math.round(
    factors.skillCoverage * 0.3 +
      factors.backupCoverage * 0.2 +
      factors.workloadSafety * 0.2 +
      factors.availability * 0.15 +
      factors.knowledgeDistribution * 0.15,
  );
}

export function scoreEmployee(
  employee: Employee,
  unavailableDuringDeadline = false,
  project: Project = PROJECT,
  employees: Employee[] = EMPLOYEES,
): { score: number; penalties: string[]; excluded: boolean } {
  if (unavailableDuringDeadline) {
    return { score: 0, penalties: ["Unavailable during the project deadline: excluded"], excluded: true };
  }
  const projectSkillLevels = project.requirements.map(requirement => employee.skills[requirement.skill] ?? 0);
  const strongestSkill = Math.max(...Object.values(employee.skills));
  const skillMatch = projectSkillLevels.length ? Math.max(...projectSkillLevels) : strongestSkill;
  const projectSkillMatch = Math.min(100, skillMatch);
  const experience = Math.min(100, employee.experienceYears * 10);
  const workloadSafety = clamp(100 - employee.workload);
  const score =
    projectSkillMatch * 0.35 +
    employee.availability * 0.2 +
    experience * 0.15 +
    workloadSafety * 0.15 +
    employee.domainExperience * 0.1 +
    employee.collaboration * 0.05;
  const penalties: string[] = [];
  let penalty = 0;
  if (employee.workload > 85) {
    penalty += 15;
    penalties.push("Over 85% workload: −15 overload penalty");
  }
  const soleCriticalSkill = project.requirements.some(
    requirement =>
      requirement.critical &&
      requirement.ownerId === employee.id &&
      employees.filter(person => person.skills[requirement.skill] >= requirement.minimum).length === 1,
  );
  if (soleCriticalSkill) {
    penalty += 10;
    penalties.push("Only expert in a critical skill: −10 dependency penalty");
  }
  return { score: Math.round(clamp(score - penalty)), penalties, excluded: false };
}

const RECOVERY_SKILL_GAINS: Record<string, Record<string, number>> = {
  aisha: { Cybersecurity: 82, AWS: 82 },
  noah: { SQL: 82 },
};

function proficiencyFor(employee: Employee, skill: string, trainingSkills?: ReadonlySet<string>): number {
  const observed = employee.skills[skill] ?? 0;
  const trainingGain = trainingSkills?.has(skill) ? RECOVERY_SKILL_GAINS[employee.id]?.[skill] ?? 0 : 0;
  return Math.max(observed, trainingGain);
}

export function getProjectedProficiency(employee: Employee, skill: string, includeTraining = true): number {
  return proficiencyFor(employee, skill, includeTraining ? new Set([skill]) : undefined);
}

export function getSuggestedCourse(skill: string): string {
  const courses: Record<string, string> = {
    Cybersecurity: "OWASP Threat Modeling & Secure Code Review",
    AWS: "AWS Cloud Practitioner · Core Services",
    Python: "Python Data Engineering Foundations",
    SQL: "SQL Data Modeling & Query Optimization",
    React: "React Component Architecture",
  };
  return courses[skill] ?? `${skill} Fundamentals & Practical Assessment`;
}

export function getSkillInventory(recoveryApplied = false, project: Project = PROJECT, employees: Employee[] = EMPLOYEES, recoverySkill?: string) {
  const trainingSkills = recoveryApplied && recoverySkill ? new Set([recoverySkill]) : undefined;
  return project.requirements.map(requirement => {
    const capable = employees.filter(employee => proficiencyFor(employee, requirement.skill, trainingSkills) >= requirement.minimum);
    const risk: RiskLevel = capable.length <= 1 ? "Critical" : capable.length === 2 ? "Medium" : "Low";
    return {
      ...requirement,
      capableCount: capable.length,
      capableNames: capable.map(employee => employee.name),
      risk,
      owner: employees.find(employee => employee.id === requirement.ownerId) ?? employees.reduce((best, candidate) => (candidate.skills[requirement.skill] ?? 0) > (best.skills[requirement.skill] ?? 0) ? candidate : best, employees[0]),
    };
  });
}

export function getEmployee(employeeId: string, employees: Employee[] = EMPLOYEES): Employee {
  return employees.find(employee => employee.id === employeeId) ?? employees[0];
}

export function getEmployeeScoreBreakdown(employee: Employee, project: Project = PROJECT, employees: Employee[] = EMPLOYEES, unavailableDuringDeadline = false) {
  const projectSkillLevels = project.requirements.map(requirement => employee.skills[requirement.skill] ?? 0);
  const strongestSkill = projectSkillLevels.length ? Math.max(...projectSkillLevels) : Math.max(...Object.values(employee.skills));
  const base = [
    { label: "Skill match", value: Math.min(100, strongestSkill), weight: 35 },
    { label: "Availability", value: employee.availability, weight: 20 },
    { label: "Experience", value: Math.min(100, employee.experienceYears * 10), weight: 15 },
    { label: "Workload safety", value: clamp(100 - employee.workload), weight: 15 },
    { label: "Domain experience", value: employee.domainExperience, weight: 10 },
    { label: "Collaboration history", value: employee.collaboration, weight: 5 },
  ];
  return { factors: base, ...scoreEmployee(employee, unavailableDuringDeadline, project, employees) };
}

export interface WorkloadPlanEntry {
  employee: Employee;
  current: number;
  proposed: number;
  available: boolean;
}

function isAbsenceScenario(scenario: ScenarioInput | null): boolean {
  return Boolean(scenario && ["absence", "resignation", "unavailable"].includes(scenario.type));
}

function recoveryCandidates(project: Project, employees: Employee[], recoverySkills: readonly string[]): Employee[] {
  const relevantSkills = new Set(project.requirements.filter(requirement => recoverySkills.includes(requirement.skill)).map(requirement => requirement.skill));
  return employees.filter(employee => Object.keys(RECOVERY_SKILL_GAINS[employee.id] ?? {}).some(skill => relevantSkills.has(skill)));
}

export function getSuggestedBackup(project: Project, skill: string, ownerId: string, employees: Employee[] = EMPLOYEES): Employee | null {
  const trained = employees.filter(employee => employee.id !== ownerId && (RECOVERY_SKILL_GAINS[employee.id]?.[skill] ?? 0) > 0);
  const candidates = trained.length ? trained : employees.filter(employee => employee.id !== ownerId);
  return [...candidates].sort((left, right) => {
    const score = (employee: Employee) => Math.max(employee.skills[skill] ?? 0, employee.skills.AWS ?? 0, employee.skills.Docker ?? 0) + employee.availability * 0.4 + (100 - employee.workload) * 0.2 + employee.collaboration * 0.1;
    return score(right) - score(left);
  })[0] ?? null;
}

export function getWorkloadPlan(
  scenario: ScenarioInput | null,
  recoveryApplied = false,
  recoveryStrategy: RecoveryStrategy = "cross-train",
  project: Project = PROJECT,
  employees: Employee[] = EMPLOYEES,
): WorkloadPlanEntry[] {
  const team = getRecommendedTeam(project, employees);
  if (!scenario) return team.map(employee => ({ employee, current: employee.workload, proposed: employee.workload, available: true }));

  const affected = getEmployee(scenario.employeeId, employees);
  if (isAbsenceScenario(scenario) && team.some(employee => employee.id === affected.id)) {
    const remaining = team.filter(employee => employee.id !== affected.id);
    const disruptedSkills = project.requirements.filter(requirement => requirement.ownerId === affected.id && requirement.critical).map(requirement => requirement.skill);
    const candidate = recoveryApplied && recoveryStrategy === "cross-train"
      ? recoveryCandidates(project, employees, disruptedSkills).find(employee => !team.some(member => member.id === employee.id))
      : undefined;
    const recipients = remaining.length || 1;
    const teamShare = affected.workload * (candidate ? 0.45 : 1) / recipients;
    const rows = team.map(employee => ({
      employee,
      current: employee.workload,
      proposed: employee.id === affected.id ? 0 : Math.round(employee.workload + teamShare),
      available: employee.id !== affected.id,
    }));
    if (candidate) rows.push({ employee: candidate, current: candidate.workload, proposed: Math.round(candidate.workload + affected.workload * 0.55), available: true });
    return rows;
  }

  const intensity = clamp(scenario.days / 14, 0.5, 1.5);
  return team.map(employee => {
    const increase = scenario.type === "workload" && employee.id === affected.id
      ? 20 * intensity
      : scenario.type === "deadline" ? 10 * intensity
      : scenario.type === "new-project" ? 8 * intensity
      : 0;
    return { employee, current: employee.workload, proposed: Math.round(clamp(employee.workload + increase)), available: true };
  });
}

export function getScenarioMetrics(
  scenario: ScenarioInput | null,
  recoveryApplied = false,
  recoveryStrategy: RecoveryStrategy = "cross-train",
  project: Project = PROJECT,
  employees: Employee[] = EMPLOYEES,
): ScenarioMetrics {
  const team = getRecommendedTeam(project, employees);
  const person = scenario ? getEmployee(scenario.employeeId, employees) : undefined;
  const absence = isAbsenceScenario(scenario);
  const canRecover = Boolean(recoveryApplied && absence && person && project.requirements.some(requirement => requirement.ownerId === person.id && requirement.critical));
  const disruptedSkills = canRecover && person ? project.requirements.filter(requirement => requirement.ownerId === person.id && requirement.critical).map(requirement => requirement.skill) : [];
  const trainingSkills = canRecover && recoveryStrategy === "cross-train" ? new Set(disruptedSkills) : undefined;
  const effectiveStrategy = canRecover ? recoveryStrategy : "cross-train";
  const workloadPlan = getWorkloadPlan(scenario, canRecover, effectiveStrategy, project, employees);
  const activeWorkloads = workloadPlan.filter(row => row.available);
  const teamWithoutUnavailable = absence && person ? team.filter(employee => employee.id !== person.id) : team;
  const trained = canRecover && recoveryStrategy === "cross-train" ? recoveryCandidates(project, employees, disruptedSkills) : [];
  const coverageTeam = [...teamWithoutUnavailable, ...trained.filter(employee => !teamWithoutUnavailable.some(member => member.id === employee.id))];
  const backupPool = canRecover && recoveryStrategy === "cross-train" ? [...team, ...trained] : teamWithoutUnavailable;
  const coveredRequirements = project.requirements.filter(requirement => coverageTeam.some(employee => proficiencyFor(employee, requirement.skill, trainingSkills) >= requirement.minimum));
  const criticalRequirements = project.requirements.filter(requirement => requirement.critical);
  const coveredBackups = criticalRequirements.filter(requirement => backupPool.filter(employee => proficiencyFor(employee, requirement.skill, trainingSkills) >= requirement.minimum).length >= 2);
  const sharedRequirements = project.requirements.filter(requirement => backupPool.filter(employee => proficiencyFor(employee, requirement.skill, trainingSkills) >= requirement.minimum).length >= 2);
  const skillCoverage = project.requirements.length ? Math.round(coveredRequirements.length / project.requirements.length * 100) : 100;
  const backupCoverage = criticalRequirements.length ? Math.round(coveredBackups.length / criticalRequirements.length * 100) : 100;
  const workloadSafety = activeWorkloads.length ? Math.round(activeWorkloads.filter(row => row.proposed <= 85).length / activeWorkloads.length * 100) : 100;
  const availabilityTeam = absence && person
    ? canRecover ? activeWorkloads.map(row => row.employee) : team.filter(employee => employee.id !== person.id)
    : team;
  const availabilityDenominator = absence && person && !canRecover ? team.length : Math.max(1, availabilityTeam.length);
  const availability = team.length ? Math.round(availabilityTeam.reduce((sum, employee) => sum + employee.availability, 0) / availabilityDenominator) : 100;
  const knowledgeDistribution = project.requirements.length ? Math.round(sharedRequirements.length / project.requirements.length * 100) : 100;

  const missingRequirements = project.requirements.filter(requirement => !coverageTeam.some(employee => proficiencyFor(employee, requirement.skill, trainingSkills) >= requirement.minimum));
  const missingCritical = missingRequirements.filter(requirement => requirement.critical);
  const requestedDays = scenario?.type === "resignation" ? Math.max(14, scenario.days) : scenario?.days ?? 0;
  let expectedDelayDays = 0;
  if (absence && person) {
    expectedDelayDays = missingCritical.length ? Math.min(project.weeksRemaining * 7, requestedDays * missingCritical.length) : canRecover && recoveryStrategy === "cross-train" ? Math.min(2, requestedDays) : canRecover ? Math.max(1, Math.round(requestedDays / 2)) : 0;
    if (!canRecover && missingCritical.length) expectedDelayDays = Math.min(project.weeksRemaining * 7, requestedDays * missingCritical.length);
    if (canRecover && recoveryStrategy === "redistribute") expectedDelayDays = Math.max(1, Math.round(requestedDays / 2));
  } else if (scenario?.type === "workload") {
    expectedDelayDays = Math.max(0, ...activeWorkloads.map(row => Math.ceil(Math.max(0, row.proposed - 85) / 5)));
  } else if (scenario?.type === "deadline") {
    expectedDelayDays = Math.max(1, Math.round(requestedDays / 7));
  } else if (scenario?.type === "new-project") {
    const overloaded = activeWorkloads.filter(row => row.proposed > 85).length;
    expectedDelayDays = overloaded ? overloaded * 2 : 0;
  }

  const factors: ContinuityFactors = {
    skillCoverage,
    backupCoverage,
    workloadSafety,
    availability,
    knowledgeDistribution,
  };
  const continuity = scoreContinuity(factors);
  const deadlineDays = Math.max(7, project.weeksRemaining * 7);
  const deadlineFeasibility = Math.round(clamp(100 - expectedDelayDays / deadlineDays * 100));
  const readiness = Math.round(clamp(continuity * 0.8 + deadlineFeasibility * 0.2));
  const risk: RiskLevel = (missingCritical.length > 0 && expectedDelayDays >= 14) || continuity < 35 ? "Critical" : continuity < 60 || expectedDelayDays > 3 || backupCoverage < 50 ? "Medium" : "Low";
  const impactedSkill = missingRequirements[0]?.skill ?? project.requirements.find(requirement => requirement.ownerId === person?.id)?.skill ?? "Team capacity";
  const cybersecurityRequirement = project.requirements.find(requirement => requirement.skill.toLowerCase() === "cybersecurity");
  const cybersecurityCoverage = !cybersecurityRequirement ? 100 : coverageTeam.some(employee => proficiencyFor(employee, cybersecurityRequirement.skill, trainingSkills) >= cybersecurityRequirement.minimum) ? 100 : 0;
  const evidence = scenario && person
    ? missingRequirements.length
      ? `${person.name}'s disruption leaves ${missingRequirements.map(requirement => requirement.skill).join(", ")} below the ${missingRequirements[0].minimum}% requirement; ${missingRequirements.length} of ${project.requirements.length} required skills remain uncovered by the active plan.`
      : `${person.name}'s disruption is covered by ${trained.map(employee => employee.name).join(" and ") || "the remaining team"}; all ${project.requirements.length} project skills meet their proficiency threshold.`
    : `${team.length} recommended employees cover ${coveredRequirements.length} of ${project.requirements.length} required skills; ${coveredBackups.length} of ${criticalRequirements.length} critical skills have two capable people.`;

  return { readiness, continuity, factors, deadlineFeasibility, cybersecurityCoverage, expectedDelayDays, risk, impactedSkill, evidence };
}

export function getScenarioLabel(type: ScenarioType): string {
  const labels: Record<ScenarioType, string> = {
    absence: "Temporary absence",
    resignation: "Resignation",
    workload: "Workload increase",
    deadline: "Urgent deadline",
    "new-project": "New project arrives",
    unavailable: "Employee unavailable",
  };
  return labels[type];
}

export function getRecommendedTeam(project: Project = PROJECT, employees: Employee[] = EMPLOYEES): Employee[] {
  const selected: Employee[] = [];
  const uncovered = new Set(project.requirements.map(requirement => requirement.skill));
  const targetSize = Math.max(1, Math.min(project.teamSize, employees.length));

  while (selected.length < targetSize) {
    const remaining = project.requirements.filter(requirement => uncovered.has(requirement.skill));
    const candidates = employees.filter(employee => !selected.some(member => member.id === employee.id));
    if (!candidates.length) break;
    candidates.sort((left, right) => {
      const value = (employee: Employee) => {
        const covered = remaining.filter(requirement => (employee.skills[requirement.skill] ?? 0) >= requirement.minimum).length;
        const partial = remaining.reduce((sum, requirement) => sum + Math.min(1, (employee.skills[requirement.skill] ?? 0) / requirement.minimum), 0);
        const capacityPenalty = employee.workload > 85 ? 250 : 0;
        return covered * 1000 + partial * 10 + scoreEmployee(employee, false, project, employees).score - capacityPenalty;
      };
      return value(right) - value(left);
    });
    const chosen = candidates[0];
    selected.push(chosen);
    for (const requirement of remaining) {
      if ((chosen.skills[requirement.skill] ?? 0) >= requirement.minimum) uncovered.delete(requirement.skill);
    }
  }
  return selected;
}

export interface ProjectDraft {
  name: string;
  description: string;
  skills: string;
  proficiency: string;
  teamSize: string;
  deadline: string;
  priority: string;
  domain: string;
}

export function projectToDraft(project: Project): ProjectDraft {
  return {
    name: project.name,
    description: project.description,
    skills: project.requirements.map(requirement => requirement.skill).join(", "),
    proficiency: String(project.requirements[0]?.minimum ?? 80),
    teamSize: String(project.teamSize),
    deadline: project.deadline,
    priority: project.priority,
    domain: project.domain,
  };
}

export function extractProjectSkills(text: string, employees: Employee[] = EMPLOYEES): string[] {
  const vocabulary = [...new Set([...employees.flatMap(employee => Object.keys(employee.skills)), "Cybersecurity", "AWS", "Python", "SQL", "React", "Docker", "Analytics"])];
  return vocabulary.filter(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
  });
}

export function createProjectFromDraft(draft: ProjectDraft, employees: Employee[] = EMPLOYEES): Project {
  const requested = draft.skills.trim() ? draft.skills.split(/[,;\n]+/) : extractProjectSkills(draft.description, employees);
  const vocabulary = [...new Set(employees.flatMap(employee => Object.keys(employee.skills)))];
  const skills = [...new Set(requested.map(skill => {
    const normalized = skill.trim().replace(/\s+(basics|advanced|proficiency)$/i, "");
    return vocabulary.find(item => item.toLowerCase() === normalized.toLowerCase()) ?? normalized;
  }).filter(Boolean))];
  const minimum = clamp(Number.parseInt(draft.proficiency, 10) || 80, 50, 100);
  const requirements = skills.map((skill, index) => {
    const owner = [...employees].sort((left, right) => (right.skills[skill] ?? 0) - (left.skills[skill] ?? 0))[0];
    return { skill, minimum, critical: index < Math.max(1, Math.ceil(skills.length * 0.75)), ownerId: owner.id };
  });
  const project: Project = {
    id: `draft-${draft.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project"}`,
    name: draft.name.trim(),
    client: draft.name.trim(),
    description: draft.description.trim(),
    domain: draft.domain,
    deadline: draft.deadline,
    weeksRemaining: Number.parseInt(draft.deadline, 10) || 8,
    priority: draft.priority === "Low" || draft.priority === "Medium" ? draft.priority : "High",
    teamSize: Math.max(1, Number.parseInt(draft.teamSize, 10) || 4),
    requirements,
    teamIds: [],
  };
  return { ...project, teamIds: getRecommendedTeam(project, employees).map(employee => employee.id) };
}

export function updateProjectFromDraft(draft: ProjectDraft, currentProject: Project, employees: Employee[] = EMPLOYEES): Project {
  const updated = createProjectFromDraft(draft, employees);
  return { ...updated, id: currentProject.id };
}

export function getTeamMetrics(project: Project = PROJECT, employees: Employee[] = EMPLOYEES) {
  const team = getRecommendedTeam(project, employees);
  const averageWorkload = team.length ? team.reduce((sum, person) => sum + person.workload, 0) / team.length : 0;
  const averageAvailability = team.length ? team.reduce((sum, person) => sum + person.availability, 0) / team.length : 0;
  return {
    averageWorkload: Math.round(averageWorkload),
    averageAvailability: Math.round(averageAvailability),
    utilization: Math.round(employees.reduce((sum, person) => sum + person.workload, 0) / Math.max(1, employees.length)),
    availableCount: employees.filter(person => person.availability >= 50).length,
    overloadedCount: employees.filter(person => person.workload > 85).length,
    underutilizedCount: employees.filter(person => person.workload < 40).length,
  };
}

export interface CopilotContext {
  project?: Project;
  employees?: Employee[];
  scenario?: ScenarioInput | null;
  recoveryApplied?: boolean;
  recoveryStrategy?: RecoveryStrategy;
}

export function getCopilotAnswer(prompt: string, metrics: ScenarioMetrics, context: CopilotContext = {}) {
  const project = context.project ?? PROJECT;
  const employees = context.employees ?? EMPLOYEES;
  const strategy = context.recoveryStrategy ?? "cross-train";
  const team = getRecommendedTeam(project, employees);
  const normalized = prompt.toLowerCase();
  const singleOwner = project.requirements.find(requirement => requirement.critical && requirement.skill.toLowerCase() === "cybersecurity" && employees.filter(employee => employee.skills[requirement.skill] >= requirement.minimum).length === 1)
    ?? project.requirements.find(requirement => requirement.critical && employees.filter(employee => employee.skills[requirement.skill] >= requirement.minimum).length === 1);
  const defaultOwner = singleOwner?.ownerId ?? project.requirements[0]?.ownerId ?? team[0]?.id ?? employees[0].id;
  const namedEmployee = employees.find(employee => normalized.includes(employee.name.split(" ")[0].toLowerCase()));
  const asksAboutAbsence = ["absent", "unavailable", "resign", "resignation", "leaves", "leave for"].some(term => normalized.includes(term));
  const promptedScenario = asksAboutAbsence && namedEmployee
    ? { type: normalized.includes("resign") ? "resignation" as const : "absence" as const, employeeId: namedEmployee.id, days: 14 }
    : undefined;
  const scenario = promptedScenario ?? context.scenario ?? { type: "absence" as const, employeeId: defaultOwner, days: 14 };
  const baseline = getScenarioMetrics(scenario, false, strategy, project, employees);
  const recovery = getScenarioMetrics(scenario, true, strategy, project, employees);
  const scenarioMatchesContext = Boolean(context.scenario && context.scenario.employeeId === scenario.employeeId && context.scenario.type === scenario.type && context.scenario.days === scenario.days);
  const activeMetrics = scenarioMatchesContext ? metrics : baseline;
  const affected = getEmployee(scenario.employeeId, employees);
  const affectedRequirement = project.requirements.find(requirement => requirement.ownerId === affected.id && requirement.critical) ?? project.requirements[0];
  const skill = affectedRequirement?.skill ?? "team capacity";
  const backup = getSuggestedBackup(project, skill, affected.id, employees) ?? affected;
  const delay = (days: number) => days <= 0 ? "no modeled delay" : days <= 2 ? "0–2 days" : days >= 14 ? `${Math.round(days / 7)} weeks` : `${days} days`;
  const scenarioDescription = scenario.type === "absence" || scenario.type === "unavailable"
    ? `${scenario.days}-day ${getScenarioLabel(scenario.type).toLowerCase()}`
    : getScenarioLabel(scenario.type).toLowerCase();
  const comparison = `Continuity ${baseline.continuity}% → ${recovery.continuity}%; backup coverage ${baseline.factors.backupCoverage}% → ${recovery.factors.backupCoverage}%; expected delay ${delay(baseline.expectedDelayDays)} → ${delay(recovery.expectedDelayDays)}.`;
  const answer = (title: string, risk: string, evidence: string, impact: string, action: string, confidence: number) => ({
    title,
    risk,
    evidence,
    impact,
    action,
    improvement: comparison,
    confidence,
  });

  if (normalized.includes("why") || normalized.includes("priya") || normalized.includes("selected")) {
    const overloaded = employees.find(employee => normalized.includes(employee.name.split(" ")[0].toLowerCase())) ?? employees.find(employee => employee.workload > 85) ?? affected;
    const overload = overloaded.workload > 85;
    return answer(
      `Why ${overloaded.name.split(" ")[0]} ${overload ? "is not assigned full-time" : "is in this recommendation"}`,
      overload ? `${overloaded.name} is above the 85% safe workload threshold.` : `${overloaded.name} has capacity, but the fit should be checked against every project skill.`,
      `${overloaded.name} has ${overloaded.workload}% workload, ${overloaded.availability}% availability and skills in ${Object.keys(overloaded.skills).join(", ")}.`,
      overload ? "Adding a critical commitment increases delivery and burnout risk." : "The project recommendation should preserve both skill coverage and safe capacity.",
      overload ? "Use the current recommended team for full-time work; retain this person as a reviewer only after capacity is confirmed." : "Compare this profile against the selected project's requirement thresholds before assigning." ,
      93,
    );
  }
  if (normalized.includes("team") || normalized.includes("compare")) {
    const covered = project.requirements.filter(requirement => team.some(member => member.skills[requirement.skill] >= requirement.minimum)).length;
    return answer(
      "Recommended team · coverage and resilience trade-off",
      `${baseline.risk} risk remains in the current project model.`,
      `${team.length} recommended people cover ${covered} of ${project.requirements.length} required skills; the most concentrated critical skill is ${skill}.`,
      `A disruption to ${affected.name} is modeled at ${delay(baseline.expectedDelayDays)} without recovery.`,
      `Use the recommended team, then compare the ${strategy === "cross-train" ? "cross-training" : "work redistribution"} recovery path before applying any hypothetical change.`,
      88,
    );
  }
  if (normalized.includes("manager briefing") || normalized.includes("briefing")) {
    return answer(
      `Executive risk briefing · ${project.client}`,
      `${project.priority} priority project; ${baseline.risk.toLowerCase()} continuity risk under the selected scenario.`,
      baseline.evidence,
      `${affected.name}'s ${scenario.type} scenario has ${delay(baseline.expectedDelayDays)} modeled impact against a ${project.deadline} deadline.`,
      `Approve a protected handover from ${affected.name} to ${backup.name}, then verify a real ${skill} task before marking the backup ready.`,
      89,
    );
  }
  if (normalized.includes("knowledge") || normalized.includes("training") || normalized.includes("plan")) {
    const mentor = affected.mentorReady?.includes(skill) ? affected : employees.find(employee => employee.mentorReady?.includes(skill));
    return answer(
      `Knowledge-transfer plan · ${skill}`,
      `${skill} has ${baseline.factors.backupCoverage}% verified backup coverage before the recovery step.`,
      `${backup.name} is the strongest available adjacent-skill candidate (${backup.availability}% availability, ${backup.workload}% workload); ${mentor?.name ?? affected.name} can mentor this skill.`,
      "A backup remains a learner until they complete and pass a practical verification task.",
      `Run an architecture walkthrough, a supervised ${skill} review and a verified task; record the mentor and learner separately.`,
      86,
    );
  }
  if (normalized.includes("backup") || normalized.includes("safest") || normalized.includes("low cost") || normalized.includes("low-cost") || normalized.includes("cheapest")) {
    return answer(
      `${backup.name} is the strongest backup candidate for ${skill}`,
      `${affected.name} is the current critical owner; verified backup coverage is ${baseline.factors.backupCoverage}%.`,
      `${backup.name} has ${backup.availability}% availability, ${backup.workload}% workload, and ${Object.keys(backup.skills).join("/")} skills.`,
      `${affected.name}'s ${scenarioDescription} is modeled at ${delay(baseline.expectedDelayDays)} without recovery.`,
      `Pair ${backup.name} with ${affected.name} for the project-specific handover and verify a real ${skill} task. This uses current staff and assumes no new headcount.`,
      91,
    );
  }
  if (asksAboutAbsence) {
    const planApplied = Boolean(context.recoveryApplied && scenarioMatchesContext);
    const after = planApplied ? metrics : recovery;
    const planState = planApplied ? "applied" : "proposed";
    return answer(
      `${skill} is the first modeled failure point`,
      `${baseline.risk} risk before recovery; ${after.risk} risk with the ${planState} plan.`,
      `Before recovery: ${baseline.evidence} After the modeled handover: ${recovery.evidence}`,
      `Without a verified backup, ${scenarioDescription} is estimated at ${delay(baseline.expectedDelayDays)} with ${baseline.factors.skillCoverage}% overall skill coverage. With the ${planState} plan, the modeled impact is ${delay(after.expectedDelayDays)} with ${after.factors.skillCoverage}% skill coverage.`,
      `Pair ${backup.name} with ${affected.name} for the ${skill} handover; keep the backup in learner status until they pass a practical verification task.`,
      94,
    );
  }
  return answer(
    `${skill} is the first modeled failure point`,
    activeMetrics.risk === "Critical" ? "The active scenario creates a critical delivery risk." : `${activeMetrics.risk} risk is visible in the current project model.`,
    activeMetrics.evidence,
    `The selected scenario estimates ${delay(activeMetrics.expectedDelayDays)} impact and leaves ${activeMetrics.factors.skillCoverage}% skill coverage.`,
    `Train ${backup.name} as a project-specific backup for ${skill}; keep the change hypothetical until the practical verification gate is passed.`,
    94,
  );
}
