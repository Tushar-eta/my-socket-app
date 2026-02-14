import { NextResponse } from "next/server";
import { getMessage } from "@/lib/messageStore";

export async function GET() {
    const message = getMessage();
    console.log("API called, returning message:", message);
    return NextResponse.json({ message });
}
