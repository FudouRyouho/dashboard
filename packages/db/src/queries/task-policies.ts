import type { DB } from '../connection';
import { taskPolicies } from '../schemas/tasks';
import { eq } from 'drizzle-orm';

export interface TaskPolicyRow {
  id: string;
  integrationId: string;
  taskType: 'calendar' | 'mediaReleases';
  everyMs: number;
  runOnStart: boolean;
  expectedDurationMs: number;
  failureMaxAttempts: number;
  failureCooldownMs: number;
}

export interface UpsertTaskPolicyInput {
  id: string;
  integrationId: string;
  taskType: 'calendar' | 'mediaReleases';
  everyMs: number;
  runOnStart: boolean;
  expectedDurationMs: number;
  failureMaxAttempts: number;
  failureCooldownMs: number;
}

export async function getAllPoliciesByIntegrationId(
  db: DB,
  integrationId: string,
): Promise<TaskPolicyRow[]> {
  const results = await db
    .select()
    .from(taskPolicies)
    .where(eq(taskPolicies.integrationId, integrationId));
  return results.map((row) => ({
    ...row,
    runOnStart: row.runOnStart === 1,
  })) as TaskPolicyRow[];
}

export async function getPolicyByIntegrationAndType(
  db: DB,
  integrationId: string,
  taskType: 'calendar' | 'mediaReleases',
): Promise<TaskPolicyRow | null> {
  const results = await db
    .select()
    .from(taskPolicies)
    .where(
      eq(taskPolicies.integrationId, integrationId) &&
        eq(taskPolicies.taskType, taskType),
    )
    .limit(1);
  const row = results[0];
  if (!row) return null;
  return {
    ...row,
    runOnStart: row.runOnStart === 1,
  } as TaskPolicyRow;
}

export async function upsertTaskPolicy(
  db: DB,
  input: UpsertTaskPolicyInput,
): Promise<void> {
  const existing = await getPolicyByIntegrationAndType(
    db,
    input.integrationId,
    input.taskType,
  );

  if (existing) {
    await db
      .update(taskPolicies)
      .set({
        everyMs: input.everyMs,
        runOnStart: input.runOnStart ? 1 : 0,
        expectedDurationMs: input.expectedDurationMs,
        failureMaxAttempts: input.failureMaxAttempts,
        failureCooldownMs: input.failureCooldownMs,
      })
      .where(eq(taskPolicies.id, input.id));
  } else {
    await db.insert(taskPolicies).values({
      id: input.id,
      integrationId: input.integrationId,
      taskType: input.taskType,
      everyMs: input.everyMs,
      runOnStart: input.runOnStart ? 1 : 0,
      expectedDurationMs: input.expectedDurationMs,
      failureMaxAttempts: input.failureMaxAttempts,
      failureCooldownMs: input.failureCooldownMs,
    });
  }
}

export async function deleteTaskPolicy(
  db: DB,
  integrationId: string,
  taskType: 'calendar' | 'mediaReleases',
): Promise<void> {
  await db
    .delete(taskPolicies)
    .where(
      eq(taskPolicies.integrationId, integrationId) &&
        eq(taskPolicies.taskType, taskType),
    );
}
