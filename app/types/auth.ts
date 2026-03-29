export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerification: boolean;
  labels: string[];
}

export interface AuthMeResponse {
  authenticated: boolean;
  user: AuthUser | null;
}
