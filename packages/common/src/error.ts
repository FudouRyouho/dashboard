/**
 * Base error class for application errors with code and optional cause
 */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message, { cause });
    this.name = 'AppError';
  }
}

/**
 * Convert unknown value to Error if not already an Error
 * @param unknown Unknown value
 * @returns Error instance
 */
export const toError = (unknown: unknown): Error =>
  unknown instanceof Error
    ? unknown
    : new Error(
        unknown === null
          ? 'null'
          : unknown === undefined
            ? 'undefined'
            : typeof unknown === 'object'
              ? JSON.stringify(unknown)
              : String(unknown),
      );

/**
 * Check if error is instance of AppError
 * @param err Error to check
 * @returns true if AppError
 */
export const isAppError = (err: unknown): err is AppError =>
  err instanceof AppError;
