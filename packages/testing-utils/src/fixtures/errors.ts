import { IntegrationError } from '@dashboard/integrations';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const errorFixtures = {
  integration: {
    unauthorized: (msg = 'Invalid API key') => new IntegrationError('unauthorized', msg, 401),
    forbidden: (msg = 'Access denied') => new IntegrationError('forbidden', msg, 403),
    timeout: (cause?: Error) => new IntegrationError('timeout', 'Request timed out', undefined, { cause }),
    unreachable: (cause?: Error) => new IntegrationError('unreachable', 'Service unreachable', undefined, { cause }),
    invalidResponse: (zodError?: z.ZodError) => new IntegrationError('invalid-response', 'Malformed response', undefined, { cause: zodError }),
  },
  http: {
    notModified: () => new Response(null, { status: 304 }),
    unauthorized: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    forbidden: () => new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    notFound: () => new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 }),
    serverError: () => new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 }),
    serviceUnavailable: () => new Response(JSON.stringify({ error: 'Service Unavailable' }), { status: 503 }),
    malformedJson: () => new Response('{"invalid":', { status: 200, headers: { 'content-type': 'application/json' } }),
  },
  trpc: {
    unauthorized: (msg = 'Integration request failed: unauthorized') => new TRPCError({ code: 'UNAUTHORIZED', message: msg }),
    forbidden: (msg = 'Integration request failed: forbidden') => new TRPCError({ code: 'FORBIDDEN', message: msg }),
    timeout: (msg = 'Integration request failed: timeout') => new TRPCError({ code: 'TIMEOUT', message: msg }),
    internal: (msg = 'Integration request failed: unknown') => new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: msg }),
  },
};

const trpcErrorSchema = z.object({
  code: z.enum(['OK', 'BAD_REQUEST', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'TIMEOUT', 'CONFLICT', 'TOO_MANY_REQUESTS', 'METHOD_NOT_ALLOWED', 'INTERNAL_SERVER_ERROR', 'BAD_GATEWAY', 'SERVICE_UNAVAILABLE', 'GATEWAY_TIMEOUT', 'CANCELLED', 'PRECONDITION_FAILED', 'PAYLOAD_TOO_LARGE']),
  message: z.string(),
  cause: z.unknown().optional(),
});

export const validateTrpcError = (err: unknown) => trpcErrorSchema.parse(err);
