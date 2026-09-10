#!/usr/bin/env node

import 'dotenv/config';
import { config } from '../config';
import { createConnection, runMigrations } from '@dashboard/db';

async function migrateConfigToDb() {
  console.log('Starting config migration...');

  const dbPath = process.env.DATABASE_PATH || './data/dashboard.db';
  const db = createConnection(dbPath);

  try {
    await runMigrations(db);
    console.log('Migrations applied successfully');

    const { upsertIntegration, upsertTaskPolicy } = await import('@dashboard/db');

    for (const integration of config.integrations) {
      console.log(`Migrating integration: ${integration.id} (${integration.kind})`);

      await upsertIntegration(db, {
        id: integration.id,
        kind: integration.kind,
        name: integration.name,
        url: integration.url,
        externalUrl: integration.externalUrl ?? null,
        apiKey: integration.apiKey ?? '',
        port: integration.port ?? null,
      });

      if (integration.tasks) {
        for (const [taskType, policy] of Object.entries(integration.tasks)) {
          if (policy && typeof policy === 'object') {
            console.log(`  Migrating task policy: ${taskType}`);
            await upsertTaskPolicy(db, {
              id: `${integration.id}-${taskType}`,
              integrationId: integration.id,
              taskType: taskType as 'calendar' | 'mediaReleases',
              everyMs: policy.everyMs ?? 3600000,
              runOnStart: policy.runOnStart ?? false,
              expectedDurationMs: policy.expectedDurationMs ?? 30000,
              failureMaxAttempts: policy.failurePolicy?.maxAttempts ?? 3,
              failureCooldownMs: policy.failurePolicy?.cooldownMs ?? 60000,
            });
          }
        }
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateConfigToDb();