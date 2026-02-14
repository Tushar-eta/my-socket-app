import type { NextApiRequest, NextApiResponse } from "next";

// This API route is disabled to prevent duplicate socket servers
// The main socket server is running in server.js
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ message: "Socket API disabled - using server.js" });
}
