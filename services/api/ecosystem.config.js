module.exports = {
  apps: [{
    name: 'ai-chat-api',
    script: 'dotenv',
    args: '-e .env -- tsx src/server.ts',
    cwd: '/var/www/ai-chat-platform/services/api',
    env: {
      NODE_ENV: 'production',
    },
  }]
};
