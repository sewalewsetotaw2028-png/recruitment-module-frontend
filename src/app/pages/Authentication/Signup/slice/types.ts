export interface AuthenticationSignupState {
  submitting: boolean;
  error: string | null;
  /** Tracks whether the last signup request completed successfully */
  signupSuccess: boolean;
}

export interface SubmitSignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

export interface SubmitEmailSigninPayload {
  email: string;
}
