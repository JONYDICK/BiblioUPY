/**
 * User type definitions to replace generic `any` types
 */

export interface BaseUser {
  id: number;
  email: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  passwordHash: string;
  isActive: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string | null;
  studentId?: string | null;
  career?: string | null;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithRoles extends BaseUser {
  roles?: string[];
  permissions?: string[];
  requiresMfa?: boolean;
}

export interface AuthenticatedUser extends UserWithRoles {
  id: number;
  email: string;
  username: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  mfaToken?: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  studentId?: string;
  career?: string;
}

export interface AuthInfo {
  message: string;
}

export interface PassportAuthResult {
  err?: Error | null;
  user?: UserWithRoles | null;
  info?: AuthInfo | null;
}
