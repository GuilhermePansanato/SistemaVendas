export interface AuthUser {
  id: string;
  companyId: string;
  companyName: string;
  modules: string[];
  name: string;
  email: string;
  role: string;
}

export interface AuthSession {
  accessToken: string | null;
  user: AuthUser | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
