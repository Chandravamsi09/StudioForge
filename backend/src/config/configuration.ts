export default () => ({
  port: parseInt(process.env.PORT, 10) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'studioforge',
    password: process.env.DB_PASSWORD || 'studioforge_secret_dev',
    database: process.env.DB_DATABASE || 'studioforge_db',
    synchronize: process.env.DB_SYNCHRONIZE === 'true' || process.env.NODE_ENV === 'test',
    logging: process.env.DB_LOGGING === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'studioforge_enterprise_jwt_super_secure_secret_key_2026',
    expiresIn: process.env.JWT_EXPIRATION || '1d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'studioforge_refresh_token_super_secure_secret_key_2026',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  plans: {
    freeMaxSeats: parseInt(process.env.FREE_TIER_MAX_SEATS, 10) || 5,
    proMaxSeats: parseInt(process.env.PRO_TIER_MAX_SEATS, 10) || 25,
    enterpriseMaxSeats: parseInt(process.env.ENTERPRISE_TIER_MAX_SEATS, 10) || 1000,
  },
});
