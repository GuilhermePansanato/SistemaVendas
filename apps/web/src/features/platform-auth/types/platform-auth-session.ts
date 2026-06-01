export interface PlatformAuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface PlatformAuthSession {
  accessToken: string | null;
  user: PlatformAuthUser | null;
}

export interface PlatformLoginInput {
  email: string;
  password: string;
}

export interface PlatformLoginResponse {
  accessToken: string;
  user: PlatformAuthUser;
}
