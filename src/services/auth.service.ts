import { UserRepository } from '@/repositories/user.repository';
import {
  normalizeRole,
  getGoogleOAuthClient,
  createSignedOAuthState,
  verifySignedOAuthState,
  createDatabaseSession,
  revokeSession,
  getAuthSecretKey,
  isGoogleOAuthConfigured,
  CanonicalRole,
} from '@/lib/auth';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

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
    if (!isGoogleOAuthConfigured()) {
      throw new Error(
        'Google OAuth credentials are not fully configured. Please ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in environment variables.'
      );
    }

    const client = getGoogleOAuthClient();
    const action = options.action || (options.role ? 'signup' : 'login');
    const { stateToken, randomState, codeVerifier, codeChallenge } = await createSignedOAuthState({
      role: options.role,
      action,
      redirectUrl: options.redirectUrl,
      oauthRedirectUri: (client as any).redirectUri,
    });

    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      state: stateToken,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256' as any,
      prompt: 'select_account',
    });

    return {
      authUrl,
      stateToken,
      randomState,
      codeVerifier,
    };
  }

  /**
   * Handles Google OAuth callback: verifies state, exchanges code with PKCE,
   * verifies Google identity token cryptographically, and executes identity mapping.
   */
  static async handleGoogleCallback(params: {
    code: string;
    returnedState: string;
    stateCookie?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<GoogleAuthCallbackResult> {
    const { code, returnedState, stateCookie, ipAddress, userAgent } = params;

    // Verify OAuth state token
    const stateTokenToVerify = returnedState || stateCookie;
    if (!stateTokenToVerify) {
      throw new Error('OAuth state missing: authentication request could not be verified.');
    }

    const stateResult = await verifySignedOAuthState(stateTokenToVerify, returnedState);
    if (!stateResult.valid) {
      throw new Error(stateResult.error || 'Invalid or expired OAuth state');
    }

    // Exchange authorization code for tokens using PKCE verifier if available
    const client = getGoogleOAuthClient(stateResult.oauthRedirectUri);
    const { tokens } = await client.getToken({
      code,
      codeVerifier: stateResult.codeVerifier,
    });

    if (!tokens.id_token) {
      throw new Error('Google OAuth failed: No identity token returned from Google authentication server.');
    }

    // Cryptographically verify ID token signature, audience, and issuer using Google public certificates
    const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId || undefined,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      throw new Error('Invalid Google token payload: sub and email are strictly required.');
    }

    return this.processGoogleIdentity({
      googleSub: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      avatarUrl: payload.picture || null,
      emailVerified: Boolean(payload.email_verified),
      role: stateResult.role,
      action: stateResult.action,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Core server logic to securely handle Google identity:
   * - Enforces existing user role preservation (never overwrite during login)
   * - Prevents automatic linking without explicit user verification (takeover prevention)
   * - Prevents privilege escalation (ADMIN role creation via Google signup blocked)
   * - Creates database-backed session upon successful signin
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
    const { googleSub, email, name, avatarUrl, emailVerified, role, action, ipAddress, userAgent } = params;
    const normalizedEmail = email.toLowerCase().trim();

    // Step 1: Check if an Account record already links this Google sub identifier
    const existingAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: googleSub,
        },
      },
      include: {
        user: true,
      },
    });

    if (existingAccount && existingAccount.user) {
      const user = existingAccount.user;

      // Existing verified user login:
      // STRICT INVARIANT: Preserve existing user's role. DO NOT overwrite with signup role.
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_LOGIN_GOOGLE',
          resource: 'User',
          details: { email: user.email, role: user.role, provider: 'google', googleSub },
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      }).catch(() => {});

      const session = await createDatabaseSession(user);

      return {
        status: 'SUCCESS',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          headline: user.headline,
        },
        session,
        targetDashboard: this.getTargetDashboard(user.role),
      };
    }

    // Step 2: If NO Account exists for this Google sub, check if User already exists with matching email
    const existingUser = await UserRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      // SECURITY GUARD: Do not silently link accounts based on email match alone.
      // Generate a signed, short-lived account linking token so user can confirm ownership.
      const secretKey = getAuthSecretKey();
      const linkingToken = await new SignJWT({
        userId: existingUser.id,
        googleSub,
        email: normalizedEmail,
        name,
        avatarUrl,
        type: 'ACCOUNT_LINKING',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('15m')
        .sign(secretKey);

      return {
        status: 'NEEDS_LINKING',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          avatarUrl: existingUser.avatarUrl,
        },
        linkingToken,
      };
    }

    // Step 3: Brand new user signup via Google OAuth
    const rawRole = (role || 'LEARNER').toUpperCase();
    if (rawRole === 'ADMIN') {
      throw new Error('Unauthorized role assignment: ADMIN accounts cannot be created via public registration.');
    }

    const validatedRole = normalizeRole(rawRole);

    // Create the User, Profile, and Account mapping inside a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const isMentor = validatedRole === 'MENTOR';
      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          name: name.trim(),
          role: validatedRole,
          avatarUrl: avatarUrl || null,
          isVerified: Boolean(emailVerified),
          profile: {
            create: {
              title:
                validatedRole === 'LEARNER'
                  ? 'Learner / Student'
                  : isMentor
                  ? 'Expert Mentor'
                  : validatedRole === 'FREELANCER'
                  ? 'Verified Professional'
                  : 'Organization Leader',
              availability: 'FULL_TIME',
              aiScore: 75,
            },
          },
          mentorProfile: isMentor
            ? {
                create: {
                  bio: `${name} is an expert mentor available for guidance on GroEarn.`,
                  expertise: 'Software Engineering, Web Development',
                  hourlyRate: 50,
                  yearsExperience: 5,
                  title: 'Expert Mentor',
                },
              }
            : undefined,
          accounts: {
            create: {
              provider: 'google',
              providerAccountId: googleSub,
            },
          },
        },
        include: {
          profile: true,
          mentorProfile: true,
        },
      });

      return createdUser;
    });

    // Record registration audit log
    await prisma.auditLog.create({
      data: {
        userId: newUser.id,
        action: 'USER_REGISTER_GOOGLE',
        resource: 'User',
        details: { email: newUser.email, role: newUser.role, provider: 'google', googleSub },
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    }).catch(() => {});

    const session = await createDatabaseSession(newUser);

    return {
      status: 'SUCCESS',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        avatarUrl: newUser.avatarUrl,
        headline: newUser.headline,
      },
      session,
      targetDashboard: this.getTargetDashboard(newUser.role),
    };
  }

  /**
   * Confirms linking a Google identity to an existing GroEarn account.
   */
  static async confirmAccountLink(params: {
    linkingToken: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<GoogleAuthCallbackResult> {
    const { linkingToken, ipAddress, userAgent } = params;

    let payload: any;
    try {
      const secretKey = getAuthSecretKey();
      const verified = await jwtVerify(linkingToken, secretKey, { algorithms: ['HS256'] });
      payload = verified.payload;
    } catch {
      throw new Error('Invalid or expired account linking request. Please try logging in again.');
    }

    if (!payload || payload.type !== 'ACCOUNT_LINKING' || !payload.userId || !payload.googleSub) {
      throw new Error('Invalid account linking token payload.');
    }

    const user = await UserRepository.findById(payload.userId);
    if (!user) {
      throw new Error('Associated user account was not found.');
    }

    // Check if provider account is already linked elsewhere
    const existingAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: payload.googleSub,
        },
      },
    });

    if (existingAccount) {
      if (existingAccount.userId !== user.id) {
        throw new Error('This Google account is already linked to another GroEarn user profile.');
      }
    } else {
      // Create identity mapping
      await prisma.account.create({
        data: {
          userId: user.id,
          provider: 'google',
          providerAccountId: payload.googleSub,
        },
      });
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ACCOUNT_LINK_GOOGLE',
        resource: 'Account',
        details: { provider: 'google', googleSub: payload.googleSub, email: user.email },
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    }).catch(() => {});

    const session = await createDatabaseSession(user);

    return {
      status: 'SUCCESS',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        headline: user.headline,
      },
      session,
      targetDashboard: this.getTargetDashboard(user.role),
    };
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
    }).catch(() => {});

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
