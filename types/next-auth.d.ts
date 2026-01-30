import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    privelegeLevel: number
    phoneNumber: string
    id: string
  }
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      privelegeLevel: number
      phoneNumber: string
      id: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    privelegeLevel: number
    phoneNumber: string
  }
}
