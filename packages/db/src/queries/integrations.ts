import type { DB } from '../connection';
import { integrationInstances } from '../schemas/integrations';
import { eq, desc, and } from 'drizzle-orm';
import { type IntegrationKind } from '@dashboard/contracts';

export interface IntegrationInstanceRow {
  id: string;
  kind: IntegrationKind;
  name: string;
  url: string;
  externalUrl: string | null;
  apiKey?: string | null;
  port: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertIntegrationInput {
  id: string;
  kind: IntegrationKind;
  name: string;
  url: string;
  externalUrl?: string | null;
  apiKey?: string;
  port?: number | null;
}

export async function getAllIntegrations(
  db: DB,
): Promise<IntegrationInstanceRow[]> {
  const rows = await db
    .select()
    .from(integrationInstances)
    .orderBy(desc(integrationInstances.createdAt));
  return rows.map((r) => ({ ...r, kind: r.kind as IntegrationKind }));
}

export async function getIntegrationById(
  db: DB,
  id: string,
): Promise<IntegrationInstanceRow | null> {
  const results = await db
    .select()
    .from(integrationInstances)
    .where(eq(integrationInstances.id, id))
    .limit(1);
  const r = results[0];
  return r ? { ...r, kind: r.kind as IntegrationKind } : null;
}

export async function getIntegrationByKindAndName(
  db: DB,
  kind: string,
  name: string,
): Promise<IntegrationInstanceRow | null> {
  const results = await db
    .select()
    .from(integrationInstances)
    .where(
      and(
        eq(integrationInstances.kind, kind),
        eq(integrationInstances.name, name),
      ),
    )
    .limit(1);
  const r = results[0];
  return r ? { ...r, kind: r.kind as IntegrationKind } : null;
}

export async function upsertIntegration(
  db: DB,
  input: UpsertIntegrationInput,
): Promise<IntegrationInstanceRow> {
  const now = new Date();
  const existing = await getIntegrationById(db, input.id);

  if (existing) {
    const updateQuery = db
      .update(integrationInstances)
      .set({
        kind: input.kind,
        name: input.name,
        url: input.url,
        externalUrl: input.externalUrl ?? null,
        apiKey: input.apiKey,
        port: input.port ?? null,
        updatedAt: now,
      })
      .where(eq(integrationInstances.id, input.id));
    await updateQuery;
  } else {
    await db.insert(integrationInstances).values({
      id: input.id,
      kind: input.kind,
      name: input.name,
      url: input.url,
      externalUrl: input.externalUrl ?? null,
      apiKey: input.apiKey,
      port: input.port ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  const results = await db
    .select()
    .from(integrationInstances)
    .where(eq(integrationInstances.id, input.id))
    .limit(1);
  if (!results[0])
    throw new Error(`Failed to retrieve integration: ${input.id}`);
  return { ...results[0], kind: results[0].kind as IntegrationKind };
}

export async function deleteIntegration(db: DB, id: string): Promise<void> {
  await db.delete(integrationInstances).where(eq(integrationInstances.id, id));
}
