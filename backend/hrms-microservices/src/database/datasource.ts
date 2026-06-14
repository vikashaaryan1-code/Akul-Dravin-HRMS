import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'path';

/**
 * Standalone DataSource for TypeORM CLI and Docker entrypoint.
 *
 * At runtime in Docker, this file compiles to:
 *   dist/database/datasource.js
 *
 * __dirname = /app/dist/database
 * migrations = /app/dist/database/migrations/*.js  ✓
 *
 * Locally with ts-node (migration:run script):
 *   __dirname = src/database
 * migrations = src/database/migrations/*.ts  ✓
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME     || 'akul_dravin_hrms',

  // Single path — works whether __dirname is src/database (ts-node) or dist/database (node)
  // TypeORM accepts both .ts and .js files in the glob.
  migrations: [
    path.join(__dirname, 'migrations', '*.{ts,js}'),
  ],

  // TypeORM is the SINGLE schema authority. synchronize: false enforces this.
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
});

