import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'akul_dravin_hrms',
  entities: [], // No entities needed for raw SQL security commands
  synchronize: false,
});

async function harden() {
  try {
    console.log('🛡️ Starting OMNIX Multi-Tenant Security Hardening...');
    await AppDataSource.initialize();

    // 1. Create Dedicated Roles if they don't exist
    console.log('👥 Setting up dedicated database roles...');
    await AppDataSource.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
          CREATE ROLE app_user WITH LOGIN PASSWORD 'omnix_secure_app';
        END IF;
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'migration_user') THEN
          CREATE ROLE migration_user WITH LOGIN PASSWORD 'omnix_secure_admin';
        END IF;
      END
      $$;
    `);

    // 2. Assign Permissions
    console.log('🔑 Assigning role-specific permissions...');
    await AppDataSource.query(`ALTER ROLE app_user NOBYPASSRLS;`);
    await AppDataSource.query(`ALTER ROLE migration_user BYPASSRLS;`);

    // 3. Enable & Force RLS on Employees
    console.log('🔒 Configuring Row Level Security on Employees...');
    await AppDataSource.query(`ALTER TABLE employees ENABLE ROW LEVEL SECURITY;`);
    await AppDataSource.query(`ALTER TABLE employees FORCE ROW LEVEL SECURITY;`);

    // 4. Create Scoped Policy with Graceful Fallback (missing_ok = true)
    console.log('📝 Creating isolation policy...');
    await AppDataSource.query(`DROP POLICY IF EXISTS tenant_isolation ON employees;`);
    await AppDataSource.query(`
      CREATE POLICY tenant_isolation ON employees
      USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
    `);

    // 5. Grant Table Access to app_user
    console.log('📑 Granting table access to app_user...');
    await AppDataSource.query(`GRANT ALL PRIVILEGES ON TABLE employees TO app_user;`);

    console.log('✅ Security Hardening Complete. OMNIX is now Zero-Trust at the DB level.');
  } catch (error) {
    console.error('❌ Hardening Failed:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

harden();
