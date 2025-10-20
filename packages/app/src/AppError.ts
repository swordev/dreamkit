export class AppError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "AppError";
    this.cause = options?.cause;
  }
}
