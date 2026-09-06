import { UserRepository } from '@/repositories/user.repository';
import { hashPassword, verifyPassword, signJwtToken } from '@/lib/auth';
import { RegisterInput, LoginInput } from '@/validators/auth.schema';

export class AuthService {
  static async register(data: RegisterInput) {
    const existing = await UserRepository.findByEmail(data.email);
    if (existing) {
      throw new Error('An account with this email address already exists');
    }

    const passwordHash = await hashPassword(data.password);
    const role = data.role === 'STUDENT' ? 'LEARNER' : data.role === 'FREELANCER' ? 'PROFESSIONAL' : data.role === 'COMPANY' ? 'EMPLOYER' : (data.role || 'LEARNER');

    const user = await UserRepository.create({
      email: data.email,
      passwordHash,
      name: data.name,
      role,
    });

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

  static async login(data: LoginInput) {
    const user = await UserRepository.findByEmail(data.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

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

  static async selectRole(userId: string, role: string) {
    const updated = await UserRepository.updateRole(userId, role);
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

    // exclude passwordHash
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}
