// Client-side Pusher configuration (only public variables)
export const pusherClientConfig = {
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
};
