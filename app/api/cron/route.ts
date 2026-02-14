import { NextResponse } from "next/server";
import * as cron from "node-cron";

// Global variable to store the cron job
let cronJob: cron.ScheduledTask | null = null;
let cronStarted = false; // Prevent multiple starts

export async function POST() {
  try {
    // Prevent multiple cron jobs from starting
    if (cronStarted && cronJob) {
      return NextResponse.json({
        message: "API Cron job already running",
        schedule: "every 10 seconds"
      });
    }

    // Stop existing cron job if running
    if (cronJob) {
      cronJob.stop();
    }

    cronStarted = true;

    // Start a new cron job that runs every 10 seconds
    cronJob = cron.schedule("*/10 * * * * *", () => {
      const msg = `Message from cron at ${new Date().toLocaleTimeString()}`;
      const messageId = `cron_${Date.now()}`;

      console.log("API Cron executed:", msg, "ID:", messageId);

      // Store in global message store for polling
      if (typeof global !== 'undefined') {
        (global as any).__messageStore__ = msg;
      }

      // Try to broadcast via socket if available
      try {
        // Import socket.io dynamically to avoid issues in API routes
        const { Server } = require('socket.io');

        // Get the socket server instance if it exists
        const httpServer = (global as any).__httpServer__;
        if (httpServer && httpServer.io) {
          const message = {
            id: messageId,
            text: msg,
            sender: "Cron Bot",
            timestamp: new Date().toISOString(),
            type: "cron"
          };
          httpServer.io.emit("receiveMessage", message);
          console.log("API Cron message broadcasted via socket, ID:", messageId);
        } else {
          console.log("No socket server available for broadcasting");
        }
      } catch (error) {
        console.log("Socket broadcast failed:", error);
      }
    });

    return NextResponse.json({
      message: "API Cron job started successfully",
      schedule: "every 10 seconds"
    });
  } catch (error) {
    console.error("Error starting API cron job:", error);
    return NextResponse.json({
      error: "Failed to start cron job"
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    if (cronJob) {
      cronJob.stop();
      cronJob = null;
    }
    cronStarted = false;
    return NextResponse.json({ message: "API Cron job stopped" });
  } catch (error) {
    return NextResponse.json({
      error: "Failed to stop cron job"
    }, { status: 500 });
  }
}
