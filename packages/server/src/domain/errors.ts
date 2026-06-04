/**
 * Domain-level errors. The API layer maps these to HTTP status codes, keeping
 * the domain ignorant of HTTP.
 */

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}
