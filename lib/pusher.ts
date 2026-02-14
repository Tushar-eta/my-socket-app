import Pusher from 'pusher';
import { pusherConfig } from '@/config/pusher';

const pusher = new Pusher({
  appId: pusherConfig.appId,
  key: pusherConfig.key,
  secret: pusherConfig.secret,
  cluster: pusherConfig.cluster,
  useTLS: true,
});

export default pusher;
