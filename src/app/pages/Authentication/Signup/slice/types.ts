export interface AuthenticationSignupState {
  submitting: boolean;
  error: string | null;
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
