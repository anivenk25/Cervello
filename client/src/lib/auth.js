import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { getServerSession } from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import { clientPromise } from "./db"; // Note: Change to destructured import

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: "ISM" // Explicitly specify the database name
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, token, user }) {
      // Add user details to the session
      if (session?.user) {
        // When using JWT strategy
        if (token) {
          session.user.id = token.sub;
          session.user.role = token.role;
          session.user.onboarded = !!token.role; // Check if user has completed onboarding
        } 
        // When using database strategy
        else if (user) {
          session.user.id = user.id;
          session.user.role = user.role;
          session.user.onboarded = !!user.role;
        }
      }
      return session;
    },
    async jwt({ token, user, account, profile }) {
      // Initial sign in
      if (account && profile) {
        token.role = user?.role;
        token.email_verified = profile.email_verified;
        token.picture = profile.picture;
      }
      return token;
    },
    async signIn({ account, profile }) {
      if (account.provider === "google") {
        // Only allow verified emails for sign-in
        return profile.email_verified;
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Handle redirects - ensure we stay within our site
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return new URL(url, baseUrl).toString();
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/',
    error: '/auth/login',
    newUser: '/auth/onboarding',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

// Helper function to get the session on the server
export async function getServerAuthSession() {
  return getServerSession(authOptions);
}

// Helper function to check if user has admin privileges
export function isUserAdmin(user) {
  return user?.role === 'admin';
}

// Helper function to check if a user has completed onboarding
export function hasCompletedOnboarding(user) {
  return !!user?.role;
}