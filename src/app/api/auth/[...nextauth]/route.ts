import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        displayName: { label: "Display Name", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        return {
          id: credentials.email,
          name: credentials.displayName || credentials.email.split("@")[0],
          email: credentials.email,
        };
      },
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    async redirect({ baseUrl }) {
      return baseUrl;
    },
  },
});

export { handler as GET, handler as POST };
