import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from '../../../../src/lib/prisma';
import type { Session, User, DefaultSession } from "next-auth";
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
        // id'yi token veya user'dan al
        session.user.id = token?.sub || user?.id;
        
        // Kullanıcının DJ ayarlarını çek
        const djSettings = await prisma.dJSettings.findUnique({
          where: { userId: session.user.id }
        });
        
        // Settings'i session'a ekle
        session.user.settings = djSettings;
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