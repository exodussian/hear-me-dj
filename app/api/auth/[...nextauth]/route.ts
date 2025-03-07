import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from '../../../../src/lib/prisma';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token, user }: { session: any; token: any; user: any }) {
      // Session işleme kodu
      if (session.user) {
        session.user.id = token?.sub || user?.id;
      }
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Yönlendirme kodu
      if (url.includes('/signin') || url === baseUrl) {
        return `${baseUrl}/dashboard`;
      }
      return url;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };