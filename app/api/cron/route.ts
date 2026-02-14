import { NextResponse } from "next/server";
import pusher from "@/lib/pusher";

// Store messages in a simple way for serverless
let latestMessage: string | null = null;

export async function POST() {
  try {
    const msg = `Message from Vercel cron at ${new Date().toLocaleTimeString()}`;
    const messageId = `cron_${Date.now()}`;

    console.log("Vercel Cron executed:", msg, "ID:", messageId);

    // Store latest message
    latestMessage = msg;

    // Send message via Pusher
    const message = {
      id: messageId,
      text: msg,
      sender: "Cron Bot",
      timestamp: new Date().toISOString(),
      type: "cron"
    };

    await pusher.trigger('chat-channel', 'new-message', message);
    console.log("Message sent via Pusher:", messageId);

    return NextResponse.json({
      message: "Cron executed successfully",
      data: message
    });
  } catch (error) {
    console.error("Error in cron:", error);
    return NextResponse.json({
      error: "Failed to execute cron"
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Cron endpoint ready",
    latestMessage: latestMessage
  });
}
