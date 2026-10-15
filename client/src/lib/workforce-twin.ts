import {
  EMPLOYEES,
  PROJECT,
  getProjectedProficiency,
  getScenarioMetrics,
  getSkillInventory,
  type Employee,
  type Project,
  type RiskLevel,
  type RecoveryStrategy,
  type ScenarioInput,
} from "@/lib/continuity-engine";

export type TwinEntityKind = "employee" | "skill" | "task" | "project";
export type TwinHealth = "healthy" | "watch" | "critical";
export type TwinTaskStatus = "At risk" | "In progress" | "Planned" | "Complete";

export interface TwinTask {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  projectClient: string;
  requiredSkills: string[];
  assignedEmployeeIds: string[];
  priority: "Critical" | "High" | "Medium" | "Low";
  status: TwinTaskStatus;
  minimumProficiency: number;
  description: string;
}

export interface TwinSkill {
  id: string;
  name: string;
  minimum: number;
  critical: boolean;
  proficiency: number;
  qualifiedEmployees: Employee[];
  availableQualifiedBackups: Employee[];
  trainingCandidates: Array<{ employee: Employee; current: number; projected: number }>;
  owner: Employee;
  health: TwinHealth;
  dependentTasks: TwinTask[];
  dependentProjects: Project[];
}

export interface TwinProject {
  project: Project;
  continuity: number;
  readiness: number;
  risk: RiskLevel;
  backupCoverage: number;
  verifiedBackupSkills: string[];
  uncoveredSkills: string[];
  criticalEmployees: Employee[];
  tasks: TwinTask[];
}

export interface WorkforceTwinModel {
  employees: Employee[];
  skills: TwinSkill[];
  tasks: TwinTask[];
  projects: TwinProject[];
}

const CLAIMS_PROJECT: Project = {
  id: "claims-modernization",
  name: "Claims Modernization",
  client: "Claims Modernization",
  description: "Modernize claims ingestion, warehouse validation and secure cloud delivery.",
  domain: "Insurance",
  deadline: "12 weeks",
  weeksRemaining: 12,
  priority: "Medium",
  teamSize: 5,
  requirements: [
    { skill: "Python", minimum: 75, critical: false, ownerId: "marcus" },
    { skill: "AWS", minimum: 75, critical: true, ownerId: "arjun" },
    { skill: "SQL", minimum: 75, critical: true, ownerId: "kavya" },
    { skill: "Data engineering", minimum: 85, critical: true, ownerId: "marcus" },
    { skill: "ETL", minimum: 85, critical: true, ownerId: "marcus" },
  ],
  teamIds: ["marcus", "arjun", "kavya", "noah"],
};

function getOwner(requirement: Project["requirements"][number], employees: Employee[]): Employee {
  const candidates = employees.filter(employee => (employee.skills[requirement.skill] ?? 0) >= requirement.minimum);
  return candidates.find(employee => employee.id === requirement.ownerId)
    ?? [...candidates].sort((left, right) => (right.skills[requirement.skill] ?? 0) - (left.skills[requirement.skill] ?? 0))[0]
    ?? employees.find(employee => employee.id === requirement.ownerId)
    ?? employees[0];
}

function makeProjectTasks(project: Project, employees: Employee[]): TwinTask[] {
  return project.requirements.map((requirement, index) => {
    const owner = getOwner(requirement, employees);
    const qualifiedCount = employees.filter(employee => (employee.skills[requirement.skill] ?? 0) >= requirement.minimum).length;
    const singleOwnerCritical = requirement.critical && qualifiedCount === 1;
    const status: TwinTaskStatus = singleOwnerCritical
      ? "At risk"
      : index % 4 === 2
        ? "Complete"
        : index % 3 === 0
          ? "In progress"
          : "Planned";
    const priority = singleOwnerCritical ? "Critical" : requirement.critical ? "High" : project.priority;
    const taskName = requirement.skill === "Cybersecurity"
      ? "Threat model & access review"
      : requirement.skill === "SQL"
        ? "Warehouse quality checks"
        : requirement.skill === "React"
          ? "Clinical analytics dashboard"
          : requirement.skill === "AWS"
            ? "Secure cloud ingestion"
            : `${requirement.skill} delivery workstream`;
    return {
      id: `${project.id}-${requirement.skill.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      title: taskName,
      projectId: project.id,
      projectName: project.name,
      projectClient: project.client,
      requiredSkills: [requirement.skill],
      assignedEmployeeIds: [owner.id],
      priority,
      status,
      minimumProficiency: requirement.minimum,
      description: `Deliver the ${requirement.skill} workstream for ${project.client}. ${singleOwnerCritical ? `${owner.name} is the only verified expert at the ${requirement.minimum}% threshold.` : `Assigned owner meets the ${requirement.minimum}% proficiency threshold.`}`,
    };
  });
}

function asHealth(critical: boolean, qualifiedCount: number): TwinHealth {
  if (qualifiedCount === 0 || (critical && qualifiedCount === 1)) return "critical";
  if (qualifiedCount === 1 || (critical && qualifiedCount < 3)) return "watch";
  return "healthy";
}

export function buildWorkforceTwin(
  activeProject: Project = PROJECT,
  employees: Employee[] = EMPLOYEES,
  scenario: ScenarioInput | null = null,
  recoveryApplied = false,
  recoveryStrategy: RecoveryStrategy = "cross-train",
): WorkforceTwinModel {
  const referenceProject = activeProject.id === CLAIMS_PROJECT.id ? PROJECT : CLAIMS_PROJECT;
  const projects = [activeProject, referenceProject];
  const tasks = projects.flatMap(project => makeProjectTasks(project, employees));
  const currentProjectMetrics = getScenarioMetrics(scenario, recoveryApplied, recoveryStrategy, activeProject, employees);

  const allSkillNames = [...new Set([
    ...employees.flatMap(employee => Object.keys(employee.skills)),
    ...projects.flatMap(project => project.requirements.map(requirement => requirement.skill)),
  ])].sort((left, right) => left.localeCompare(right));

  const skills: TwinSkill[] = allSkillNames.map(name => {
    const requirements = projects.flatMap(project => project.requirements.filter(requirement => requirement.skill === name));
    const activeRequirement = activeProject.requirements.find(requirement => requirement.skill === name);
    const minimum = activeRequirement?.minimum ?? requirements[0]?.minimum ?? 80;
    const qualifiedEmployees = employees.filter(employee => (employee.skills[name] ?? 0) >= minimum);
    const ownerRequirement = activeRequirement ?? requirements[0];
    const owner = ownerRequirement ? getOwner(ownerRequirement, employees) : [...employees].sort((left, right) => (right.skills[name] ?? 0) - (left.skills[name] ?? 0))[0];
    const critical = requirements.some(requirement => requirement.critical);
    const availableQualifiedBackups = qualifiedEmployees.filter(employee => employee.id !== owner.id && employee.availability > 0 && !(scenario && employee.id === scenario.employeeId && ["absence", "resignation", "unavailable"].includes(scenario.type)));
    const belowThreshold = employees
      .filter(employee => employee.id !== owner.id && (employee.skills[name] ?? 0) < minimum && employee.availability > 0)
      .map(employee => ({ employee, current: employee.skills[name] ?? 0, projected: getProjectedProficiency(employee, name) }))
      .filter(candidate => candidate.projected > candidate.current || candidate.current > 0)
      .sort((left, right) => right.projected - left.projected || right.employee.availability - left.employee.availability)
      .slice(0, 3);
    const dependentTasks = tasks.filter(task => task.requiredSkills.includes(name));
    const dependentProjects = projects.filter(project => project.requirements.some(requirement => requirement.skill === name));
    const riskRequirement = activeRequirement ?? requirements[0];
    const health = asHealth(critical || Boolean(riskRequirement?.critical), qualifiedEmployees.length);
    return {
      id: `skill:${name}`,
      name,
      minimum,
      critical,
      proficiency: owner.skills[name] ?? 0,
      qualifiedEmployees,
      availableQualifiedBackups,
      trainingCandidates: belowThreshold,
      owner,
      health,
      dependentTasks,
      dependentProjects,
    };
  });

  const skillInventory = getSkillInventory(false, activeProject, employees);
  const projectViews: TwinProject[] = projects.map((project, index) => {
    const metrics = index === 0
      ? currentProjectMetrics
      : getScenarioMetrics(null, false, "cross-train", project, employees);
    const requirements = index === 0 ? skillInventory : getSkillInventory(false, project, employees);
    const projectTasks = tasks.filter(task => task.projectId === project.id);
    const criticalEmployees = [...new Map(
      requirements.filter(item => item.critical && item.capableCount === 1).map(item => [item.owner.id, item.owner]),
    ).values()];
    const unavailableEmployeeId = index === 0 && scenario && ["absence", "resignation", "unavailable"].includes(scenario.type)
      ? scenario.employeeId
      : undefined;
    const availableEmployees = employees.filter(employee => employee.availability > 0 && employee.id !== unavailableEmployeeId);
    const criticalRequirements = requirements.filter(requirement => requirement.critical);
    const verifiedBackupSkills = criticalRequirements
      .filter(requirement => availableEmployees.filter(employee => (employee.skills[requirement.skill] ?? 0) >= requirement.minimum).length >= 2)
      .map(requirement => requirement.skill);
    const uncoveredSkills = requirements
      .filter(requirement => !availableEmployees.some(employee => (employee.skills[requirement.skill] ?? 0) >= requirement.minimum))
      .map(requirement => requirement.skill);
    return {
      project,
      continuity: metrics.continuity,
      readiness: metrics.readiness,
      risk: metrics.risk,
      backupCoverage: metrics.factors.backupCoverage,
      verifiedBackupSkills,
      uncoveredSkills,
      criticalEmployees,
      tasks: projectTasks,
    };
  });

  return { employees, skills, tasks, projects: projectViews };
}

export function isEmployeeUnavailable(employee: Employee, scenario: ScenarioInput | null): boolean {
  return Boolean(scenario && employee.id === scenario.employeeId && ["absence", "resignation", "unavailable"].includes(scenario.type));
}
