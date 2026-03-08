/**
 * Environment variables validation
 * Ensures all required secrets are present and valid at startup
 */

interface ValidationRule {
  key: string;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

const MIN_JWT_SECRET_LENGTH = 32;

export function validateEnv() {
  const rules: ValidationRule[] = [
    {
      key: 'JWT_SECRET',
      validator: (value) => value.length >= MIN_JWT_SECRET_LENGTH,
      errorMessage: `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long for security`,
    },
    {
      key: 'DATABASE_URL',
      validator: (value) => value.startsWith('postgresql://'),
      errorMessage: 'DATABASE_URL must be a valid PostgreSQL connection string (postgresql://...)',
    },
    {
      key: 'OPENROUTER_API_KEY',
      validator: (value) => value.length > 0,
      errorMessage: 'OPENROUTER_API_KEY cannot be empty',
    },
    {
      key: 'YOOKASSA_SHOP_ID',
      validator: (value) => value.length > 0,
      errorMessage: 'YOOKASSA_SHOP_ID cannot be empty',
    },
    {
      key: 'YOOKASSA_SECRET_KEY',
      validator: (value) => value.length > 0,
      errorMessage: 'YOOKASSA_SECRET_KEY cannot be empty',
    },
    {
      key: 'YOOKASSA_WEBHOOK_SECRET',
      validator: (value) => value.length > 0,
      errorMessage: 'YOOKASSA_WEBHOOK_SECRET cannot be empty',
    },
  ];

  const errors: string[] = [];

  for (const rule of rules) {
    const value = process.env[rule.key];

    if (!value) {
      errors.push(`❌ ${rule.key} is not set`);
    } else if (rule.validator && !rule.validator(value)) {
      errors.push(`❌ ${rule.key}: ${rule.errorMessage}`);
    }
  }

  // Validate optional variables with defaults
  const optionalWithDefaults = [
    { key: 'PORT', default: '3001' },
    { key: 'HOST', default: '0.0.0.0' },
    { key: 'NODE_ENV', default: 'development' },
    { key: 'FRONTEND_URL', default: 'http://localhost:3000' },
  ];

  for (const opt of optionalWithDefaults) {
    if (!process.env[opt.key]) {
      console.log(`ℹ️  ${opt.key} not set, using default: ${opt.default}`);
      process.env[opt.key] = opt.default;
    }
  }

  // Check Redis URL (optional but recommended for production)
  if (!process.env.REDIS_URL) {
    console.warn('⚠️  REDIS_URL not set - caching will be disabled');
  }

  if (errors.length > 0) {
    console.error('\n🚨 Environment validation failed:\n');
    errors.forEach(error => console.error(`   ${error}`));
    console.error('\n💡 See .env.example for required environment variables');
    console.error('📖 Documentation: DOCKER_DEPLOYMENT.md\n');
    process.exit(1);
  }

  console.log('✅ All required environment variables are valid');
}

export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}
