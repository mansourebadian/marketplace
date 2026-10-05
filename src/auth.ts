import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import { getAuthPage } from '@/lib/auth-flow';

export const { handlers, auth, signIn, signOut } = NextAuth(async (request) => {
  const authPage = await getAuthPage(request);
  return {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'database',
  },
  providers: [
    Google({
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email.toLowerCase(),
          image: profile.picture,
          emailVerified: profile.email_verified ? new Date() : null,
          role: 'CUSTOMER',
        };
      },
    }),
  ],
  pages: {
    signIn: authPage,
    error: authPage,
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'google') {
        return true;
      }

      const googleProfile = profile as
        | { email?: string; email_verified?: boolean }
        | undefined;

      return Boolean(googleProfile?.email && googleProfile.email_verified);
    },
    session({ session, user }) {
      const role =
        'role' in user && typeof user.role === 'string'
          ? user.role
          : 'CUSTOMER';
      const rawExpires = session.expires as string | Date;

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role,
        },
        expires:
          rawExpires instanceof Date
            ? rawExpires.toISOString()
            : rawExpires,
      };
    },
  },
  events: {
    async linkAccount({ user, account, profile }) {
      const verifiedAt =
        'emailVerified' in profile && profile.emailVerified instanceof Date
          ? profile.emailVerified
          : null;

      if (account.provider === 'google' && verifiedAt) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: verifiedAt },
        });
      }
    },
  },
  };
});
