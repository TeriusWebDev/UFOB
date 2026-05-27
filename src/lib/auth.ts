import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from './db'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        matricula: { label: 'Matrícula', type: 'text' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.matricula || !credentials?.password) return null

        const staff = await db.staff.findUnique({
          where: { matricula: credentials.matricula },
        })

        if (!staff) return null

        const passwordMatch = await bcrypt.compare(credentials.password, staff.password)
        if (!passwordMatch) return null

        return {
          id: staff.id,
          name: staff.name,
          matricula: staff.matricula,
          role: staff.role,
        } as any
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.matricula = (user as any).matricula
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).matricula = token.matricula
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: '/atendente/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
