import { OAuthService } from './auth/oauth.service';
import { UserRepository } from '@/repositories/user.repository';
import {
  normalizeRole,
  createDatabaseSession,
  revokeSession,
} from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/password';
import { RegisterInput, LoginInput } from '@/validators/auth.schema';

export interface GoogleAuthCallbackResult {
  status: 'SUCCESS' | 'NEEDS_LINKING' | 'ERROR';
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatarUrl?: string | null;
    headline?: string | null;
  };
  session?: {
    sessionToken: string;
    cookieValue: string;
  };
  linkingToken?: string;
  targetDashboard?: string;
  error?: string;
}

export class AuthService {
  /**
   * Initializes the Google OAuth flow with PKCE and server-signed state parameter.
   */
  static async initiateGoogleAuth(options: {
    role?: string;
    action?: 'signup' | 'login';
    redirectUrl?: string;
  }) {
    return OAuthService.initiateGoogleAuth(options);
  }

  /**
   * Handles Google OAuth callback.
   */
  static async handleGoogleCallback(params: {
    code: string;
    returnedState: string;
    stateCookie?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<GoogleAuthCallbackResult> {
    return OAuthService.handleGoogleCallback(params);
  }

  /**
   * Internal identity mapping engine for Google accounts.
   */
  static async processGoogleIdentity(params: {
    googleSub: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
    emailVerified?: boolean;
    role?: string;
    action?: 'signup' | 'login';
    ipAddress?: string;
    userAgent?: string;
  }): Promise<GoogleAuthCallbackResult> {
    return OAuthService.processGoogleIdentity(params);
  }

  /**
   * Confirms linking a Google identity to an existing account after user verification.
   */
  static async confirmAccountLink(params: {
    linkingToken: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<GoogleAuthCallbackResult> {
    return OAuthService.confirmAccountLink(params);
  }

  /**
 * Updates user role for active authenticated user.
 */
  static async selectRole(userId: string, role: string, ipAddress?: string, userAgent?: string) {
    const rawRole = role.toUpperCase();
    if (rawRole === 'ADMIN') {
      throw new Error('Unauthorized role escalation: ADMIN role cannot be self-assigned.');
    }

    const normalized = normalizeRole(rawRole);

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Critical Invariant: Prevent unauthorized role changes.
    // When a user signs up as a role (e.g. LEARNER, FREELANCER, MENTOR, COMPANY), they must retain
    // that role and cannot self-switch roles to access other role areas.
    if (user.role && user.role !== normalized) {
      throw new Error(`Forbidden: Account role is permanently assigned to ${user.role}. Self-service role swapping is forbidden.`);
    }

    // Critical Invariant: Prevent removing or demoting the last active administrator
    if (user.role === 'ADMIN' && normalized !== 'ADMIN') {
      const activeAdminCount = await prisma.user.count({
        where: { role: 'ADMIN' },
      });
      if (activeAdminCount <= 1) {
        throw new Error('Forbidden: Cannot remove or demote the last active platform administrator.');
      }
    }

    const updated = await UserRepository.updateRole(userId, normalized);

    // Record role change audit log
    await prisma.auditLog.create({
      data: {
        userId: updated.id,
        action: 'ROLE_CHANGE',
        resource: 'User',
        details: { previousRole: user.role, newRole: normalized },
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    }).catch(() => { });

    const session = await createDatabaseSession(updated);

    return {
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        avatarUrl: updated.avatarUrl,
      },
      session,
      token: session.cookieValue,
    };
  }

  static async registerWithPassword(input: RegisterInput, ipAddress?: string, userAgent?: string) {
    const requestedRole = (input.role || 'LEARNER').toUpperCase();
    if (requestedRole === 'ADMIN') {
      throw new Error('Unauthorized role assignment: ADMIN accounts cannot be created via public registration.');
    }

    const canonicalRole = normalizeRole(requestedRole);
    const email = input.email.toLowerCase().trim();

    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('An account with this email address already exists. Please log in.');
    }

    const passwordHash = await hashPassword(input.password);

    const newUser = await UserRepository.create({
      email,
      passwordHash,
      name: input.name.trim(),
      role: canonicalRole,
      isVerified: false,
    });

    await prisma.auditLog.create({
      data: {
        userId: newUser.id,
        action: 'USER_REGISTER_PASSWORD',
        resource: 'User',
        details: { email: newUser.email, role: newUser.role },
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    }).catch(() => { });

    const session = await createDatabaseSession(newUser);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        avatarUrl: newUser.avatarUrl,
      },
      session,
      targetDashboard: this.getTargetDashboard(newUser.role),
    };
  }

  private static readonly DUMMY_PASSWORD_HASH =
    '0123456789abcdef0123456789abcdef:' + '0'.repeat(128);

  static async loginWithPassword(input: LoginInput, ipAddress?: string, userAgent?: string) {
    const email = input.email.toLowerCase().trim();
    const user = await UserRepository.findByEmail(email);

    // Constant-time protection: always execute scrypt even if user does not exist
    const targetHash = user?.passwordHash || this.DUMMY_PASSWORD_HASH;
    const isValid = await verifyPassword(input.password, targetHash);

    if (!user || !user.passwordHash || !isValid) {
      throw new Error('Invalid email or password.');
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN_PASSWORD',
        resource: 'User',
        details: { email: user.email, role: user.role },
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    }).catch(() => { });

    const session = await createDatabaseSession(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: normalizeRole(user.role),
        avatarUrl: user.avatarUrl,
      },
      session,
      targetDashboard: this.getTargetDashboard(user.role),
    };
  }

  static async logout(sessionToken?: string) {
    if (sessionToken) {
      await revokeSession(sessionToken);
    }
  }

  static async getCurrentUser(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) return null;

    const { passwordHash: _passwordHash, ...safeUser } = user;
    void _passwordHash;
    return safeUser;
  }

  static getTargetDashboard(role: string): string {
    const normalized = normalizeRole(role);
    switch (normalized) {
      case 'LEARNER':
        return '/learner/dashboard';
      case 'FREELANCER':
        return '/freelancer/dashboard';
      case 'MENTOR':
        return '/mentor/dashboard';
      case 'COMPANY':
        return '/company/dashboard';
      case 'ADMIN':
        return '/admin/dashboard';
      default:
        return '/feed';
    }
  }
}
