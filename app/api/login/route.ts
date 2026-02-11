/**
 * API layer for chat       
 * POST /api/chat - create a chat identifier
 * POST /api/chat/{identifier} - post a question to backend
 */

import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createAccessToken } from "@/lib/auth/jwt";

interface LoginRequest {
    username: string;
    password: string;
}

interface LoginResponse {
    identifier: string;
    status: "success" | "error";
    timestamp: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const { username, password } = await request.json() as LoginRequest;
        if (!username || !password) {
            return NextResponse.json({ error: "Username and Password are required." }, { status: 400 });
        }

        const isUsernameValid = process.env.USER_NAME === username;
        const isPasswordValid = process.env.PASSWORD === password;
        if (!isUsernameValid || !isPasswordValid) {
            return NextResponse.json({ error: "Invalid Username or Password." }, { status: 400 });
        }

        // create a random uuid for chat session identifier
        const identifier = uuidv4();
        const token = await createAccessToken({ identifier, username }, 60);

        const response = NextResponse.json(
            { identifier, status: "success", timestamp: new Date().toISOString() } as LoginResponse
        );
        response.cookies.set("access_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60, // 60 minutes
            path: "/",
        });
        return response;
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal server error", status: "error", timestamp: new Date().toISOString() }, { status: 500 });
    }
}
