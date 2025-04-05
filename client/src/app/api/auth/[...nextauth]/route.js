import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// This creates the API route handler for Next Auth
const handler = NextAuth(authOptions);

// Export the handler with both GET and POST methods
export { handler as GET, handler as POST };