import { z } from 'zod';
import { integrationKinds } from './kinds';

export const integrationInputBaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url(),
  externalUrl: z.string().url().optional(),
  port: z.number().int().positive().optional(),
});

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