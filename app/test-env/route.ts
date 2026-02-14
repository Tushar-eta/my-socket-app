import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Environment test",
    envVars: {
      PUSHER_APP_ID: process.env.PUSHER_APP_ID,
      NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY,
      PUSHER_SECRET: process.env.PUSHER_SECRET,
      NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      NODE_ENV: process.env.NODE_ENV,
      ALL_PUSHER_VARS: Object.keys(process.env).filter(key => key.includes('PUSHER'))
    }
  });
}
