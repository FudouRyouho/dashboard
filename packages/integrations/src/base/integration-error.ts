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
      status === 401 ? 'unauthorized' : status === 403 ? 'forbidden' : 'unknown';

    return new IntegrationError(
      reason,
      `Integration request failed with HTTP ${status} ${statusText}`,
      status,
    );
  }

  static fromTransport(error: unknown) {
    if (error instanceof IntegrationError) return error;
    if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
      return new IntegrationError('timeout', 'Integration request timed out', undefined, { cause: error });
    }

    // Handle FetchError (from ofetch) and similar errors with HTTP status
    const status = (error as { status?: number; statusCode?: number; response?: { status?: number } })?.status
      ?? (error as { statusCode?: number })?.statusCode
      ?? (error as { response?: { status?: number } })?.response?.status;
    if (Number.isFinite(status)) {
      const reason: IntegrationErrorReason =
        status === 401 ? 'unauthorized' : status === 403 ? 'forbidden' : 'unknown';
      return new IntegrationError(
        reason,
        `Integration request failed with HTTP ${status}`,
        status,
        { cause: error },
      );
    }

    return new IntegrationError('unknown', 'Integration request failed', undefined, { cause: error });
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

    const cause = (err as { cause?: { code?: string; cause?: { code?: string } } }).cause;
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

    const status = (err as { status?: number; statusCode?: number; response?: { status?: number } })?.status
      ?? (err as { statusCode?: number })?.statusCode
      ?? (err as { response?: { status?: number } })?.response?.status
      ?? Number(err.message.match(/HTTP\s+(\d{3})/)?.[1]);
    if (Number.isFinite(status)) {
      return {
        reason: status === 401 ? 'unauthorized' : status === 403 ? 'forbidden' : 'unknown',
        httpStatus: status,
      };
    }
  }

  return { reason: 'unknown' };
};
