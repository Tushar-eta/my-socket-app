import { NextResponse } from "next/server";

// This API route is disabled to prevent duplicate socket servers
// The main socket server is running in server.js
export async function GET() {
  return NextResponse.json({ message: "Socket API disabled - using server.js" });
}

export async function POST() {
  return NextResponse.json({ message: "Socket API disabled - using server.js" });
}
