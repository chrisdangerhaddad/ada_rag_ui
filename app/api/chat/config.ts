// Export the runtime configuration for Edge
export const runtime = 'edge';

// We're not using the AI SDK's built-in config anymore
// since we're handling the streaming manually
export const config = {
  api: {
    // Increase the body size limit if needed
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};