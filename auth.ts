import NextAuth from 'next-auth';
import { authConfig } from './lib/auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { Role } from './lib/generated/prisma/enums';
import { prisma } from './lib/prisma';

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({
                        phone: z.string().min(10),
                        otp: z.string().length(6),
                        role: z.enum(["FARMER", "BUYER"]).optional()
                    })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { phone, otp, role } = parsedCredentials.data;

                    // 1. Verify OTP
                    const verificationToken = await prisma.verificationToken.findUnique({
                        where: {
                            identifier_token: {
                                identifier: phone,
                                token: otp,
                            },
                        },
                    });

                    if (!verificationToken) {
                        console.log("Invalid OTP");
                        return null;
                    }

                    if (verificationToken.expires < new Date()) {
                        console.log("OTP Expired");
                        // Clean up expired token
                        await prisma.verificationToken.delete({
                            where: { identifier_token: { identifier: phone, token: otp } }
                        });
                        return null;
                    }

                    // 2. OTP Valid - Delete it (single use)
                    await prisma.verificationToken.delete({
                        where: { identifier_token: { identifier: phone, token: otp } }
                    });

                    // 3. Find or Create User
                    let user = await prisma.user.findUnique({
                        where: { phone },
                    });

                    if (!user) {
                        // New user
                        user = await prisma.user.create({
                            data: {
                                phone,
                                role: (role as Role) || Role.FARMER,
                            },
                        });
                    }

                    // Return user object compatible with NextAuth User
                    return {
                        id: user.id,
                        phone: user.phone ?? undefined, // Handle null -> undefined
                        role: user.role,
                        image: null,
                        name: user.name
                    };
                }

                console.log("Invalid credentials format");
                return null;
            },
        }),
    ],
});
