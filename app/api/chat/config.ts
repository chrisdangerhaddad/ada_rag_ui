import { AIConfig } from 'ai';

// Configure the AI module to use our route for chat
export const runtime = 'edge';

export const config: AIConfig = {
  baseUrl: '/api/chat'
};
