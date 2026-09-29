import { IntegrationErrorReason } from '@dashboard/contracts';
import { z } from 'zod';

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
      status === 401
        ? 'unauthorized'
        : status === 403
          ? 'forbidden'
          : status === 422
            ? 'invalid-response'
            : status === 503
              ? 'timeout'
              : 'unknown';

    return new IntegrationError(
      reason,
      `Integration request failed with HTTP ${status} ${statusText}`,
      status,
    );
  }

  static fromTransport(error: unknown) {
    // Delegate classification to the single source of truth
    const classified = classifyIntegrationError(error);

    // If it's already an IntegrationError, return it directly
    if (error instanceof IntegrationError) return error;

    // Map classified reason to appropriate message
    const messages: Record<IntegrationErrorReason, string> = {
      unauthorized: 'Integration request failed with HTTP 401',
      forbidden: 'Integration request failed with HTTP 403',
      unreachable: 'Integration request failed: unreachable',
      timeout: 'Integration request timed out',
      'invalid-response': 'Integration request failed: invalid response',
      unknown: 'Integration request failed',
    };

    return new IntegrationError(
      classified.reason,
      messages[classified.reason],
      classified.httpStatus,
      { cause: error },
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

    const cause = (
      err as { cause?: { code?: string; cause?: { code?: string } } }
    ).cause;
    const networkCodes = [
      'ECONNREFUSED',
      'ENOTFOUND',
      'EHOSTUNREACH',
      'ENETUNREACH',
      'ECONNRESET',
      'EAI_AGAIN',
    ];
    if (
      (cause?.code && networkCodes.includes(cause.code)) ||
      (cause?.cause?.code && networkCodes.includes(cause.cause.code))
    ) {
      return { reason: 'unreachable' };
    }

    const status =
      (
        err as {
          status?: number;
          statusCode?: number;
          response?: { status?: number };
        }
      )?.status ??
      (err as { statusCode?: number })?.statusCode ??
      (err as { response?: { status?: number } })?.response?.status ??
      Number(err.message.match(/HTTP\s+(\d{3})/)?.[1]);
    if (Number.isFinite(status)) {
      return {
        reason:
          status === 401
            ? 'unauthorized'
            : status === 403
              ? 'forbidden'
              : status === 422
                ? 'invalid-response'
                : status === 503
                  ? 'timeout'
                  : 'unknown',
        httpStatus: status,
      };
    }
  }

  return { reason: 'unknown' };
};
