import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { Usuario } from "@/lib/entities";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credenciales",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const result = await Usuario.get({
          username: credentials.username as string,
        }).go();
        const usuario = result.data;
        if (!usuario) return null;

        const passwordOk = await bcrypt.compare(
          credentials.password as string,
          usuario.passwordHash
        );
        if (!passwordOk) return null;

        return {
          id: usuario.username,
          name: usuario.nombre,
          username: usuario.username,
          rol: usuario.rol,
          listaSlug: usuario.listaSlug ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.rol = (user as any).rol;
        token.username = (user as any).username;
        token.listaSlug = (user as any).listaSlug ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).rol = token.rol;
        (session.user as any).username = token.username;
        (session.user as any).listaSlug = token.listaSlug;
      }
      return session;
    },
  },
});
