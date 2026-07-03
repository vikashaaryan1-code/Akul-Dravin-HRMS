import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: 'postgres',
  password: '', // Connect as superuser to have permission to alter roles and tables
  database: process.env.DB_NAME || 'akul_dravin_hrms',
  entities: [], // No entities needed for raw SQL security commands
  synchronize: false,
});

async function harden() {
  try {
    console.log('🛡️ Starting AKUL DRAVIN Multi-Tenant Security Hardening...');
    await AppDataSource.initialize();

    // 1. Create Dedicated Roles if they don't exist
    console.log('👥 Setting up dedicated database roles...');
    try {
      await AppDataSource.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
            CREATE ROLE app_user WITH LOGIN PASSWORD 'akuldravin_secure_app';
          END IF;
          IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'migration_user') THEN
            CREATE ROLE migration_user WITH LOGIN PASSWORD 'akuldravin_secure_admin';
          END IF;
        END
        $$;
      `);
      
      // 2. Assign Permissions
      console.log('🔑 Assigning role-specific permissions...');
      await AppDataSource.query(`ALTER ROLE app_user NOBYPASSRLS;`);
      await AppDataSource.query(`ALTER ROLE migration_user BYPASSRLS;`);
    } catch (roleError: any) {
      console.warn('⚠️ Dedicated role setup skipped or denied (this is normal if running as a non-superuser):', roleError.message || roleError);
    }

    // 3. Enable & Force RLS on Core Tables
    console.log('🔒 Configuring Row Level Security on Core Tables...');
    const tables = ['employees', 'vendors', 'vendor_purchase_orders'];
    for (const table of tables) {
      console.log(`  - Configuring RLS on ${table}...`);
      await AppDataSource.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
      await AppDataSource.query(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY;`);
      
      console.log(`  - Creating isolation policy on ${table}...`);
      await AppDataSource.query(`DROP POLICY IF EXISTS tenant_isolation ON ${table};`);
      await AppDataSource.query(`
        CREATE POLICY tenant_isolation ON ${table}
        USING (tenant_id::text = current_setting('app.tenant_id', true));
      `);

      console.log(`  - Granting table access to app_user for ${table}...`);
      await AppDataSource.query(`GRANT ALL PRIVILEGES ON TABLE ${table} TO app_user;`);
    }

    console.log('✅ Security Hardening Complete. AKUL DRAVIN is now Zero-Trust at the DB level.');
  } catch (error) {
    console.error('❌ Hardening Failed:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

harden();
