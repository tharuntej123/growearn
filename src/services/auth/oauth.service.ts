import crypto from 'crypto';
import { UserRepository } from '@/repositories/user.repository';
import {
  normalizeRole,
  getGoogleOAuthClient,
  createSignedOAuthState,
  verifySignedOAuthState,
  createDatabaseSession,
  getAuthSecretKey,
  isGoogleOAuthConfigured,
} from '@/lib/auth';
import { CodeChallengeMethod } from 'google-auth-library';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { GoogleAuthCallbackResult, AuthService } from '../auth.service';

export class OAuthService {
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
      oauthRedirectUri: (client as unknown as { redirectUri?: string }).redirectUri,
    });

    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      state: stateToken,
      code_challenge: codeChallenge,
      code_challenge_method: CodeChallengeMethod.S256,
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

    // Anti-CSRF verification: Require state parameter
    if (!returnedState) {
      throw new Error('OAuth state parameter missing from provider callback.');
    }

    // When stateCookie is available, enforce strict timing-safe match between query state and cookie
    if (stateCookie) {
      const stateBuf = Buffer.from(returnedState);
      const cookieBuf = Buffer.from(stateCookie);
      if (stateBuf.length !== cookieBuf.length || !crypto.timingSafeEqual(stateBuf, cookieBuf)) {
        throw new Error('OAuth state CSRF validation failed: State parameter does not match session cookie.');
      }
    }

    const stateTokenToVerify = stateCookie || returnedState;
    const stateResult = await verifySignedOAuthState(stateTokenToVerify, returnedState);
    if (!stateResult.valid) {
      throw new Error(stateResult.error || 'Invalid or expired OAuth state');
    }

    // Exchange authorization code for tokens using PKCE verifier if available
    let client = getGoogleOAuthClient(stateResult.oauthRedirectUri);
    let tokens;
    try {
      const res = await client.getToken({
        code,
        codeVerifier: stateResult.codeVerifier,
      });
      tokens = res.tokens;
    } catch (tokenErr) {
      // If code exchange fails with the primary redirectUri, retry with alternate callback URI variant
      const primaryUri = stateResult.oauthRedirectUri || '';
      const altRedirect = primaryUri.includes('/api/auth/callback/google')
        ? primaryUri.replace('/api/auth/callback/google', '/api/auth/google/callback')
        : primaryUri.replace('/api/auth/google/callback', '/api/auth/callback/google');

      if (altRedirect && altRedirect !== primaryUri) {
        const altClient = getGoogleOAuthClient(altRedirect);
        const altRes = await altClient.getToken({
          code,
          codeVerifier: stateResult.codeVerifier,
        });
        tokens = altRes.tokens;
        client = altClient;
      } else {
        throw tokenErr;
      }
    }

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
    const {
      googleSub,
      email: rawEmail,
      name,
      avatarUrl,
      emailVerified,
      role: requestedRole,
      action = 'login',
      ipAddress,
      userAgent,
    } = params;

    const email = rawEmail.toLowerCase().trim();

    // Check if Google account already linked
    const existingGoogleAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: googleSub,
        },
      },
      include: {
        user: {
          include: {
            profile: true,
            mentorProfile: true,
          },
        },
      },
    });

    if (existingGoogleAccount) {
      const user = existingGoogleAccount.user;

      if (avatarUrl && !user.avatarUrl) {
        await prisma.user.update({ where: { id: user.id }, data: { avatarUrl } }).catch(() => { });
      }

      // Record login audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_LOGIN_GOOGLE',
          resource: 'User',
          details: { email: user.email, role: user.role, provider: 'google', googleSub },
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      }).catch(() => { });

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
        targetDashboard: AuthService.getTargetDashboard(user.role),
      };
    }

    // Check if a user with this email already exists
    const existingUser = await UserRepository.findByEmail(email);

    if (existingUser) {
      if (emailVerified === false) {
        throw new Error('Google account email is not verified by Google. Unverified Google accounts cannot be linked.');
      }

      if (action === 'signup') {
        throw new Error('An account with this email already exists. Please log in to link your Google account.');
      }

      // Generate secure single-use signed account linking token
      const secretKey = getAuthSecretKey();
      const jti = crypto.randomUUID();
      const linkingToken = await new SignJWT({
        userId: existingUser.id,
        googleSub,
        email,
        type: 'ACCOUNT_LINKING',
        jti,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('10m')
        .sign(secretKey);

      return {
        status: 'NEEDS_LINKING',
        linkingToken,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
        },
      };
    }

    // New User Registration Flow
    const rawRole = (requestedRole || 'LEARNER').toUpperCase();
    if (rawRole === 'ADMIN') {
      throw new Error('Unauthorized role assignment: ADMIN accounts cannot be created via public OAuth signup.');
    }

    const validatedRole = normalizeRole(rawRole);
    const isMentor = validatedRole === 'MENTOR';

    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          name,
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
                bio: `${name} is an expert mentor available for guidance on GrowEarn.`,
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
    }).catch(() => { });

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
      targetDashboard: AuthService.getTargetDashboard(newUser.role),
    };
  }

  /**
   * Confirms linking a Google identity to an existing GrowEarn account.
   */
  static async confirmAccountLink(params: {
    linkingToken: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<GoogleAuthCallbackResult> {
    const { linkingToken, ipAddress, userAgent } = params;

    let payload: Record<string, unknown>;
    try {
      const secretKey = getAuthSecretKey();
      const verified = await jwtVerify(linkingToken, secretKey, { algorithms: ['HS256'] });
      payload = verified.payload as Record<string, unknown>;
    } catch {
      throw new Error('Invalid or expired account linking request. Please try logging in again.');
    }

    if (!payload || payload.type !== 'ACCOUNT_LINKING' || !payload.userId || !payload.googleSub) {
      throw new Error('Invalid account linking token payload.');
    }

    const userId = String(payload.userId);
    const googleSub = String(payload.googleSub);
    const jti = typeof payload.jti === 'string' ? payload.jti : null;

    if (jti) {
      const alreadyUsed = await prisma.auditLog.findFirst({
        where: {
          action: 'ACCOUNT_LINK_GOOGLE',
          details: {
            path: ['jti'],
            equals: jti,
          },
        },
      });
      if (alreadyUsed) {
        throw new Error('This account linking token has already been consumed. Please initiate a new sign-in.');
      }
    }

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error('Associated user account was not found.');
    }

    // Check if provider account is already linked elsewhere
    const existingAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: googleSub,
        },
      },
    });

    if (existingAccount) {
      if (existingAccount.userId !== user.id) {
        throw new Error('This Google account is already linked to another GrowEarn user profile.');
      }
    } else {
      // Create identity mapping
      await prisma.account.create({
        data: {
          userId: user.id,
          provider: 'google',
          providerAccountId: googleSub,
        },
      });
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ACCOUNT_LINK_GOOGLE',
        resource: 'Account',
        details: { provider: 'google', googleSub, email: user.email, jti },
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    }).catch(() => { });

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
      targetDashboard: AuthService.getTargetDashboard(user.role),
    };
  }
}
