// auth-options.ts
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from '../../../../src/lib/prisma';
import type { DefaultSession, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { AdapterUser } from "next-auth/adapters";

// DefaultSession'ı genişlet
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      settings?: any;
    } & DefaultSession["user"]
  }
}

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
    async session({ session, token, user }: { session: Session; token: JWT; user: AdapterUser }) {
      if (session.user) {
        session.user.id = token?.sub || user?.id;
        
        const djSettings = await prisma.dJSettings.findUnique({
          where: { userId: session.user.id }
        });
        
        session.user.settings = djSettings;
      }
      return session;
    },
  
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      if (url.includes('/signin') || url === baseUrl) {
        return `${baseUrl}/dashboard`;
      }
      return url;
    },
  },
};