import { BrowserContext } from '@playwright/test';
import { prisma } from '../src/lib/prisma';
import { createDatabaseSession } from '../src/lib/auth';

export async function loginAsRole(
  context: BrowserContext,
  role: 'LEARNER' | 'FREELANCER' | 'MENTOR' | 'COMPANY' | 'ADMIN',
  email?: string
) {
  const targetEmail =
    email ||
    (role === 'LEARNER'
      ? 'learner@example.com'
      : role === 'FREELANCER'
      ? 'freelancer@example.com'
      : role === 'MENTOR'
      ? 'mentor@example.com'
      : role === 'COMPANY'
      ? 'company@example.com'
      : 'admin@growearn.com');

  let user = await prisma.user.findFirst({
    where: { email: targetEmail },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: targetEmail,
        name: `${role} User`,
        role,
        isVerified: true,
      },
    });
  }

  const session = await createDatabaseSession(user);

  await context.addCookies([
    {
      name: 'growearn_session',
      value: session.cookieValue,
      domain: '127.0.0.1',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
    {
      name: 'growearn_session',
      value: session.cookieValue,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  return user;
}
