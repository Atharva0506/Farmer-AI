import { Role } from "../generated/prisma/enums"
import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: Role
            phone?: string
        } & DefaultSession["user"]
    }

    interface User {
        role: Role
        phone?: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: Role
        id: string
    }
}
