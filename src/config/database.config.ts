import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (): TypeOrmModuleOptions => {
  // Use PostgreSQL if DATABASE_URL is provided (production)
  if (process.env.DATABASE_URL) {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: true, // Set to false in production after initial setup
      ssl: {
        rejectUnauthorized: false,
      },
      logging: process.env.NODE_ENV === 'development',
    };
  }

  // Use SQLite for local development
  return {
    type: 'better-sqlite3',
    database: process.env.DB_PATH || 'prowisla.db',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: true,
    logging: process.env.NODE_ENV === 'development',
  };
};
