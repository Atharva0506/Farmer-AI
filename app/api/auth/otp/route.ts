import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const otpSchema = z.object({
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { phone } = otpSchema.parse(body);

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Delete existing OTPs for this phone
        await prisma.verificationToken.deleteMany({
            where: { identifier: phone },
        });

        // Create new OTP
        await prisma.verificationToken.create({
            data: {
                identifier: phone,
                token: otp,
                expires,
            },
        });

        // In a real application, you would send the OTP via SMS here.
        console.log(`===============================================`);
        console.log(`OTP for ${phone}: ${otp}`);
        console.log(`===============================================`);

        return NextResponse.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        console.error("Error sending OTP:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
