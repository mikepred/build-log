export class ScriptError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ScriptError';
  }
}

/** A Hashnode HTTP, redirect, or GraphQL failure. The runner records nothing, keeps going, and fails the run at the end. */
export class HashnodeApiError extends Error {
  constructor(detail) {
    super(detail);
    this.name = 'HashnodeApiError';
    this.detail = detail;
  }
}
