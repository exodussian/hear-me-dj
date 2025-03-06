import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, user }: { session: any; user: any }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Giriş için dashboard'a yönlendir
      if (url.includes('/signin') || url === baseUrl) {
        return `${baseUrl}/dashboard`;
      }
      // Diğer yönlendirmeler
      return url;
    },
  },
};