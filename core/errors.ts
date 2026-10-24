/** Error raised for authentication validation or service response failures. */
export class LoginError extends Error {
  /** Create an authentication error with a human-readable failure message. */
  constructor(message: string) {
    super(message);
    this.name = "LoginError";
  }
}
