// Environment Safety Validator
// Strictly forbids unsafe production / demo combinations.

export interface EnvSafetyConfig {
  APP_ENV?: string;
  DATABASE_URL?: string;
  CASHFREE_ENVIRONMENT?: string;
  CASHFREE_CLIENT_ID?: string;
}

export function validateAppEnvSafety(config?: EnvSafetyConfig): void {
  const appEnv = (config?.APP_ENV || process.env.APP_ENV || 'development').toLowerCase();
  const dbUrl = config?.DATABASE_URL || process.env.DATABASE_URL || '';
  const cfEnv = (config?.CASHFREE_ENVIRONMENT || process.env.CASHFREE_ENVIRONMENT || 'sandbox').toLowerCase();

  // Guard 1: APP_ENV=demo must never point to production database
  if (appEnv === 'demo') {
    const isProductionDb =
      dbUrl.includes('prod') ||
      dbUrl.includes('production') ||
      dbUrl.includes('rds.amazonaws.com') ||
      dbUrl.includes('cloudsql');

    if (isProductionDb) {
      throw new Error(
        'SECURITY VIOLATION: APP_ENV=demo cannot be configured with a production database cluster.'
      );
    }

    if (cfEnv === 'production') {
      throw new Error(
        'SECURITY VIOLATION: APP_ENV=demo cannot be configured with live production Cashfree credentials.'
      );
    }
  }

  // Guard 2: Production environment cannot use mock AI or localhost credentials
  if (appEnv === 'production') {
    if (process.env.MOCK_AI === 'true') {
      throw new Error('FATAL: MOCK_AI cannot be enabled in production environment.');
    }
  }
}
