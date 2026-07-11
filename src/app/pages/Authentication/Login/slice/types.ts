export interface AuthenticationLoginState {
  submitting: boolean;
  error: string | null;
}

export interface SubmitLoginPayload {
  email: string;
  password: string;
}

export interface SubmitEmailSigninPayload {
  email: string;
}
