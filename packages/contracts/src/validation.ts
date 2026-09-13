import {
  calendarEventSchema,
  calendarResultSchema,
  type CalendarEvent,
} from './calendar';

import {
  mediaReleaseSchema,
  mediaReleasesResponseSchema,
  type MediaReleaseEvent,
  type MediaReleasesResponse,
} from './media-releases';

import {
  integrationInputBaseSchema,
  integrationOutputSchema,
  integrationPublicSchema,
} from './integrations';

import {
  resultStatusSchema,
  type ResultStatus,
} from './result';

import type { IntegrationKind } from './kinds';

// Validation functions
export const validateCalendarEvent = (data: unknown): CalendarEvent => {
  return calendarEventSchema.parse(data);
};

export const safeValidateCalendarEvent = (data: unknown) => {
  return calendarEventSchema.safeParse(data);
};

export const validateCalendarResult = (data: unknown) => {
  return calendarResultSchema.parse(data);
};

export const validateMediaReleaseEvent = (data: unknown): MediaReleaseEvent => {
  return mediaReleaseSchema.parse(data);
};

export const safeValidateMediaReleaseEvent = (data: unknown) => {
  return mediaReleaseSchema.safeParse(data);
};

export const validateMediaReleasesResponse = (data: unknown): MediaReleasesResponse => {
  return mediaReleasesResponseSchema.parse(data);
};

export const validateIntegrationInput = (data: unknown) => {
  return integrationInputBaseSchema.parse(data);
};

export const safeValidateIntegrationInput = (data: unknown) => {
  return integrationInputBaseSchema.safeParse(data);
};

export const validateIntegrationOutput = (data: unknown) => {
  return integrationOutputSchema.parse(data);
};

export const validateIntegrationPublic = (data: unknown) => {
  return integrationPublicSchema.parse(data);
};

export const validateResultStatus = (data: unknown): ResultStatus => {
  return resultStatusSchema.parse(data);
};

export const safeValidateResultStatus = (data: unknown) => {
  return resultStatusSchema.safeParse(data);
};

// Type guards
export const isCalendarEvent = (data: unknown): data is CalendarEvent => {
  return calendarEventSchema.safeParse(data).success;
};

export const isMediaReleaseEvent = (data: unknown): data is MediaReleaseEvent => {
  return mediaReleaseSchema.safeParse(data).success;
};

export const isResultStatus = (data: unknown): data is ResultStatus => {
  return resultStatusSchema.safeParse(data).success;
};

export const isDataView = (data: unknown): data is 'never-queried' | 'fresh' | 'outdated' | 'missing' => {
  return ['never-queried', 'fresh', 'outdated', 'missing'].includes(data as string);
};

export const isIntegrationKind = (data: unknown): data is IntegrationKind => {
  return ['sonarr', 'radarr', 'jellyfin', 'docker', 'prometheus'].includes(data as string);
};