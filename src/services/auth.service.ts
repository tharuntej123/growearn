import { UserRepository } from '@/repositories/user.repository';
import { hashPassword, verifyPassword, signJwtToken, normalizeRole } from '@/lib/auth';
import { RegisterInput, LoginInput } from '@/validators/auth.schema';
import { prisma } from '@/lib/prisma';

export class AuthService {
  static async register(data: RegisterInput, ipAddress?: string, userAgent?: string) {
    const rawRole = (data.role || 'LEARNER').toUpperCase();
    if (rawRole === 'ADMIN') {
      throw new Error('Unauthorized role assignment: ADMIN accounts cannot be created via public registration.');
    }

    const existing = await UserRepository.findByEmail(data.email.toLowerCase().trim());
    if (existing) {
      throw new Error('An account with this email address already exists');
    }

    const passwordHash = await hashPassword(data.password);
    const role = normalizeRole(rawRole);

    const user = await UserRepository.create({
      email: data.email.toLowerCase().trim(),
      passwordHash,
      name: data.name.trim(),
      role,
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTER',
        resource: 'User',
        details: { email: user.email, role: user.role },
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    }).catch(() => {});

    const token = signJwtToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        headline: user.headline,
      },
      token,
    };
  }

  static async login(data: LoginInput, ipAddress?: string, userAgent?: string) {
    const email = data.email.toLowerCase().trim();
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      // Record failed login audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_LOGIN_FAILED',
          resource: 'User',
          details: { email },
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      }).catch(() => {});
      throw new Error('Invalid email or password');
    }

    // Record successful login audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        resource: 'User',
        details: { email: user.email, role: user.role },
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    }).catch(() => {});

    const token = signJwtToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        headline: user.headline,
      },
      token,
    };
  }

  static async selectRole(userId: string, role: string, ipAddress?: string, userAgent?: string) {
    const rawRole = role.toUpperCase();
    if (rawRole === 'ADMIN') {
      throw new Error('Unauthorized role escalation: ADMIN role cannot be self-assigned.');
    }

    const normalized = normalizeRole(rawRole);
    const updated = await UserRepository.updateRole(userId, normalized);

    // Record role change audit log
    await prisma.auditLog.create({
      data: {
        userId: updated.id,
        action: 'ROLE_CHANGE',
        resource: 'User',
        details: { previousRole: updated.role, newRole: normalized },
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    }).catch(() => {});

    const token = signJwtToken({
      userId: updated.id,
      email: updated.email,
      role: updated.role,
      name: updated.name,
    });

    return {
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        avatarUrl: updated.avatarUrl,
      },
      token,
    };
  }

  static async getCurrentUser(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) return null;

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}
