import type { DB } from '../connection';
import { taskPolicies } from '../schemas/tasks';
import { eq, and } from 'drizzle-orm';

export type TaskType = 'calendar' | 'mediaReleases' | 'docker';

export interface TaskPolicyRow {
  id: string;
  integrationId: string;
  taskType: TaskType;
  everyMs: number;
  runOnStart: boolean;
  expectedDurationMs: number;
  failureMaxAttempts: number;
  failureCooldownMs: number;
}

export interface UpsertTaskPolicyInput {
  id: string;
  integrationId: string;
  taskType: TaskType;
  everyMs: number;
  runOnStart: boolean;
  expectedDurationMs: number;
  failureMaxAttempts: number;
  failureCooldownMs: number;
}

function parseRunOnStart(value: number | boolean): boolean {
  return value === 1 || value === true;
}

function serializeRunOnStart(value: boolean): number {
  return value ? 1 : 0;
}

/**
 * Get all policies for a given integration
 * @param db Database connection
 * @param integrationId Integration ID
 * @returns Policy list
 */
export async function getAllPoliciesByIntegrationId(
  db: DB,
  integrationId: string,
): Promise<TaskPolicyRow[]> {
  const results = await db
    .select()
    .from(taskPolicies)
    .where(eq(taskPolicies.integrationId, integrationId));
  return results.map(r => ({
    ...r,
    runOnStart: parseRunOnStart(r.runOnStart),
  })) as unknown as TaskPolicyRow[];
}

/**
 * Get a policy for a specific integration and task type
 * @param db Database connection
 * @param integrationId Integration ID
 * @param taskType Task type (calendar/mediaReleases)
 * @returns Policy or null
 */
export async function getPolicyByIntegrationAndType(
  db: DB,
  integrationId: string,
  taskType: TaskType,
): Promise<TaskPolicyRow | null> {
  const results = await db
    .select()
    .from(taskPolicies)
    .where(
      and(
        eq(taskPolicies.integrationId, integrationId),
        eq(taskPolicies.taskType, taskType),
      ),
    )
    .limit(1);
  const row = results[0];
  if (!row) return null;
  return {
    ...row,
    runOnStart: parseRunOnStart(row.runOnStart),
  } as unknown as TaskPolicyRow;
}

/**
 * Insert or update a task policy (unique constraint: integrationId + taskType)
 * @param db Database connection
 * @param input Policy data
 */
export async function upsertTaskPolicy(
  db: DB,
  input: UpsertTaskPolicyInput,
): Promise<void> {
  const existing = await getPolicyByIntegrationAndType(
    db,
    input.integrationId,
    input.taskType,
  );

  const serializedInput = {
    ...input,
    runOnStart: serializeRunOnStart(input.runOnStart),
  };

  if (existing) {
    await db
      .update(taskPolicies)
      .set({
        everyMs: serializedInput.everyMs,
        runOnStart: serializedInput.runOnStart,
        expectedDurationMs: serializedInput.expectedDurationMs,
        failureMaxAttempts: serializedInput.failureMaxAttempts,
        failureCooldownMs: serializedInput.failureCooldownMs,
      })
      .where(eq(taskPolicies.id, input.id));
  } else {
    await db.insert(taskPolicies).values(serializedInput);
  }
}

/**
 * Delete a policy for a specific integration and task type
 * @param db Database connection
 * @param integrationId Integration ID
 * @param taskType Task type (calendar/mediaReleases)
 */
export async function deleteTaskPolicy(
  db: DB,
  integrationId: string,
  taskType: TaskType,
): Promise<void> {
  await db
    .delete(taskPolicies)
    .where(
      and(
        eq(taskPolicies.integrationId, integrationId),
        eq(taskPolicies.taskType, taskType),
      ),
    );
}