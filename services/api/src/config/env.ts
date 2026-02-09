/**
 * Environment variables validation
 * Ensures all required secrets are present at startup
 */

export function validateEnv() {
  const required = [
    'JWT_SECRET',
    'DATABASE_URL',
    'OPENROUTER_API_KEY',
  ];

  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nPlease set these variables in your .env file');
    process.exit(1);
  }

  console.log('✅ All required environment variables are set');
}

export function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}
