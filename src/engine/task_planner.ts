import { GuppiDB, TaskPlan, TaskStep } from '../db/client.js';

export class TaskPlannerEngine {
  constructor(private db: GuppiDB) {}

  public createPlan(goal: string, customTitle?: string): { plan: TaskPlan; steps: TaskStep[] } {
    const title = customTitle || `Task Plan: ${goal.slice(0, 40)}...`;
    const plan = this.db.createTaskPlan(title, goal);

    // Dynamic DAG Step Decomposition
    const defaultSteps: Omit<TaskStep, 'id' | 'plan_id' | 'created_at' | 'updated_at'>[] = [
      {
        step_number: 1,
        title: 'Requirement & Architectural Analysis',
        description: `Analyze codebase topology and dependencies for: "${goal}"`,
        assigned_role: 'Architect',
        dependencies: [],
        status: 'pending',
      },
      {
        step_number: 2,
        title: 'Core Implementation & Engine Logic',
        description: `Develop main classes and business logic for: "${goal}"`,
        assigned_role: 'Code Generator',
        dependencies: ['1'],
        status: 'pending',
      },
      {
        step_number: 3,
        title: 'Automated Unit & Integration Test Suite',
        description: `Write automated tests verifying functionality for: "${goal}"`,
        assigned_role: 'Test Engineer',
        dependencies: ['2'],
        status: 'pending',
      },
      {
        step_number: 4,
        title: 'Pre-flight Safety Audit & Verification Pass',
        description: `Run guardrail checks and AST impact analysis for: "${goal}"`,
        assigned_role: 'Reviewer',
        dependencies: ['3'],
        status: 'pending',
      },
    ];

    const createdSteps: TaskStep[] = [];
    for (const step of defaultSteps) {
      const created = this.db.addTaskStep({ ...step, plan_id: plan.id });
      createdSteps.push(created);
    }

    return { plan, steps: createdSteps };
  }

  public updateStepStatus(stepId: string, status: TaskStep['status'], result?: string) {
    this.db.updateTaskStepStatus(stepId, status, result);
  }

  public getPlanProgress(planId: string) {
    const plan = this.db.getTaskPlan(planId);
    if (!plan) throw new Error(`Task plan "${planId}" not found.`);
    const steps = this.db.getTaskSteps(planId);
    const completed = steps.filter((s) => s.status === 'completed').length;
    const progressPercent = steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0;

    return {
      plan,
      steps,
      completedCount: completed,
      totalCount: steps.length,
      progressPercent,
    };
  }

  public listActivePlans(limit: number = 20) {
    const plans = this.db.getTaskPlans(limit);
    return plans.map((p) => this.getPlanProgress(p.id));
  }
}
