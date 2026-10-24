export class ScriptError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ScriptError';
  }
}

/** A Hashnode HTTP, redirect, or GraphQL failure. The runner records nothing and continues. */
export class HashnodeApiError extends Error {
  constructor(detail) {
    super(detail);
    this.name = 'HashnodeApiError';
    this.detail = detail;
  }
}
