module.exports = {
  apps: [{
    name: 'ai-chat-api',
    script: 'src/server.ts',
    interpreter: 'tsx',
    cwd: '/var/www/ai-chat-platform/services/api',
    env: {
      NODE_ENV: 'production',
    },
    env_file: '.env',
  }]
};
