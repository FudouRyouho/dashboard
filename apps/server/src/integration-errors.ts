import { TRPCError } from '@trpc/server';
import {
  classifyIntegrationError,
} from '@dashboard/integrations';
import type { IntegrationErrorReason } from '@dashboard/contracts';

const trpcCodeByReason: Record<IntegrationErrorReason, 'UNAUTHORIZED' | 'FORBIDDEN' | 'TIMEOUT' | 'INTERNAL_SERVER_ERROR'> = {
  unauthorized: 'UNAUTHORIZED',
  forbidden: 'FORBIDDEN',
  unreachable: 'INTERNAL_SERVER_ERROR',
  timeout: 'TIMEOUT',
  'invalid-response': 'INTERNAL_SERVER_ERROR',
  unknown: 'INTERNAL_SERVER_ERROR',
};

export function toIntegrationTRPCError(error: unknown, message = 'Integration request failed') {
  const classified = classifyIntegrationError(error);
  return new TRPCError({
    code: trpcCodeByReason[classified.reason]!,
    message: `${message}: ${classified.reason}`,
    cause: error,
  });
}
