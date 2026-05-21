import type { UserRole } from '@prisma/client';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyPassword } from '@/features/residents/password';

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

type AuthorizedUser = {
  role: UserRole;
};

type ResidentSessionUser = {
  id: string;
  role: UserRole;
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: '邮箱', type: 'email' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email.toLowerCase();
        const user = await db.user.findUnique({ where: { email } });

        if (!user) {
          return null;
        }

        const passwordMatches = await verifyPassword(parsed.data.password, user.passwordHash);

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.nickname,
          image: user.avatarUrl,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as AuthorizedUser).role;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const resident = session.user as typeof session.user & ResidentSessionUser;
        const residentToken = token as typeof token & { role: UserRole };
        resident.id = token.sub ?? '';
        resident.role = residentToken.role;
      }

      return session;
    },
  },
});
