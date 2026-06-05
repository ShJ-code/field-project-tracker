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

/** A call to an external provider (weather, geocoding) failed. */
export class UpstreamError extends Error {
  constructor(
    message: string,
    readonly providerStatus?: number,
  ) {
    super(message);
    this.name = 'UpstreamError';
  }
}
