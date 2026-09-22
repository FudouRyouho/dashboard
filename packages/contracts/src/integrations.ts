import { z } from 'zod';
import { integrationKinds } from './kinds';
import type { IntegrationKind } from './kinds';

// Secret requirement per integration kind
export type SecretRequirement = { kind: string; required: boolean };

export const secretRequirements: Record<IntegrationKind, SecretRequirement[]> = {
  sonarr: [{ kind: 'apiKey', required: true }],
  radarr: [{ kind: 'apiKey', required: true }],
  jellyfin: [{ kind: 'apiKey', required: true }],
  qbittorrent: [
    { kind: 'username', required: true },
    { kind: 'password', required: true },
  ],
  docker: [],
  prometheus: [],
} as const;

export const integrationInputBaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url(),
  externalUrl: z.string().url().optional(),
  port: z.number().int().positive().optional(),
});

// Discriminated union for upsert input - each kind has its own required secrets
export const upsertIntegrationInputSchema = z.discriminatedUnion('kind', [
  integrationInputBaseSchema.extend({
    kind: z.literal('sonarr'),
    apiKey: z.string().min(1),
    port: z.number().int().positive().default(8989),
  }).strict(),
  integrationInputBaseSchema.extend({
    kind: z.literal('radarr'),
    apiKey: z.string().min(1),
    port: z.number().int().positive().default(7878),
  }).strict(),
  integrationInputBaseSchema.extend({
    kind: z.literal('jellyfin'),
    apiKey: z.string().min(1),
    port: z.number().int().positive().default(8096),
  }).strict(),
  integrationInputBaseSchema.extend({
    kind: z.literal('qbittorrent'),
    username: z.string().min(1),
    password: z.string().min(1),
    port: z.number().int().positive().default(8080),
  }).strict(),
  integrationInputBaseSchema.extend({
    kind: z.literal('docker'),
    port: z.number().int().positive().default(2375),
  }).strict(),
  integrationInputBaseSchema.extend({
    kind: z.literal('prometheus'),
    port: z.number().int().positive().default(9090),
  }).strict(),
]);

export const integrationOutputSchema = z.object({
  id: z.string(),
  kind: z.enum(integrationKinds),
  name: z.string(),
  url: z.string().url(),
  externalUrl: z.string().url().nullable(),
  port: z.number().int().positive().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const integrationPublicSchema = z.object({
  kind: z.enum(integrationKinds),
  id: z.string(),
  name: z.string(),
  url: z.string(),
});