import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    privilegeLevel: number
    phoneNumber: string
    id: string
  }
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      privilegeLevel: number
      phoneNumber: string
      id: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    privilegeLevel: number
    phoneNumber: string
  }
}
