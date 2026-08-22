import { z } from 'zod';

export const integrationErrorReasons = [
  'unauthorized',
  'unreachable',
  'timeout',
  'invalid-response',
  'unknown',
] as const;

export type IntegrationErrorReason = (typeof integrationErrorReasons)[number];

export class IntegrationError extends Error {
  constructor(
    public readonly reason: IntegrationErrorReason,
    message: string,
    public readonly httpStatus?: number,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'IntegrationError';
  }

  static fromHttpResponse(status: number, statusText: string) {
    const reason: IntegrationErrorReason =
      status === 401 || status === 403 ? 'unauthorized' : 'unknown';

    return new IntegrationError(
      reason,
      `Integration request failed with HTTP ${status} ${statusText}`,
      status,
    );
  }
}

export const classifyIntegrationError = (
  err: unknown,
): { reason: IntegrationErrorReason; httpStatus?: number } => {
  if (err instanceof IntegrationError) {
    return { reason: err.reason, httpStatus: err.httpStatus };
  }

  if (err instanceof z.ZodError) {
    return { reason: 'invalid-response' };
  }

  if (err instanceof Error) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return { reason: 'timeout' };
    }

    const cause = (err as { cause?: { code?: string } }).cause;
    const networkCodes = [
      'ECONNREFUSED',
      'ENOTFOUND',
      'EHOSTUNREACH',
      'ENETUNREACH',
      'ECONNRESET',
      'EAI_AGAIN',
    ];
    if (cause?.code && networkCodes.includes(cause.code)) {
      return { reason: 'unreachable' };
    }
  }

  return { reason: 'unknown' };
};
