import { NextResponse } from "next/server";
import pusher from "@/lib/pusher";

export async function POST(request: Request) {
  try {
    const { message, sender } = await request.json();
    
    const messageData = {
      id: Date.now(),
      text: message,
      sender: sender || 'Anonymous',
      timestamp: new Date().toISOString(),
      type: 'user'
    };

    // Send message via Pusher
    await pusher.trigger('chat-channel', 'new-message', messageData);
    console.log("User message sent via Pusher:", messageData.id);

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      data: messageData
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({
      error: "Failed to send message"
    }, { status: 500 });
  }
}
