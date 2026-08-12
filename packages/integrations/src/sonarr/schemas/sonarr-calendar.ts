import { z } from "zod";

const sonarrImageSchema = z.object({ coverType: z.string().optional(), remoteUrl: z.string().nullable().optional(), }).passthrough();

const sonarrSeriesSchema = z.object({ id: z.number(), title: z.string(), titleSlug: z.string(), overview: z.string().nullable().optional(), images: z.array(sonarrImageSchema).default([]) }).passthrough();

export const sonarrCalenderEvenSchema = z.object({ id: z.number(), title: z.string(), airDateUtc: z.coerce.date(), seasonNumber: z.number(), episodeNumber: z.number(), series: sonarrSeriesSchema }).passthrough();

export const sonarrCalendarResponseSchema = z.array(sonarrCalenderEvenSchema,);