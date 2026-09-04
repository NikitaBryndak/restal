import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    role?: string
    allowedPages?: string[]
    phoneNumber: string
    id: string
  }
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
      allowedPages?: string[]
      phoneNumber: string
      id: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    allowedPages?: string[]
    phoneNumber: string
  }
}
