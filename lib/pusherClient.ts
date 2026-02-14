import Pusher from 'pusher-js';
import { pusherClientConfig } from '@/config/pusherClient';

const pusher = new Pusher(pusherClientConfig.key, {
  cluster: pusherClientConfig.cluster,
});

export default pusher;
