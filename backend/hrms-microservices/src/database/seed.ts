import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './entities/user.entity';
import { Role } from '../common/enums/role.enum';

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'akul_dravin_hrms',
    entities: [__dirname + '/entities/*.entity{.ts,.js}'],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('Database connected');

  const userRepo = dataSource.getRepository(UserEntity);

  // Check if users already exist
  const existingUsers = await userRepo.count();
  if (existingUsers > 0) {
    console.log('Users already exist. Skipping seed.');
    await dataSource.destroy();
    return;
  }

  const passwordHash = await bcrypt.hash('password123', 10);

  const users = [
    {
      email: 'admin@akuldravin.com',
      passwordHash,
      fullName: 'Platform Admin',
      role: Role.PLATFORM_ADMIN,
      tenantId: null,
      isActive: true,
    },
    {
      email: 'superadmin@akuldravin.com',
      passwordHash,
      fullName: 'Super Admin',
      role: Role.SUPER_ADMIN,
      tenantId: null,
      isActive: true,
    },
    {
      email: 'hr@akuldravin.com',
      passwordHash,
      fullName: 'HR Manager',
      role: Role.HR_MANAGER,
      tenantId: null,
      isActive: true,
    },
    {
      email: 'manager@akuldravin.com',
      passwordHash,
      fullName: 'Team Manager',
      role: Role.TEAM_MANAGER,
      tenantId: null,
      isActive: true,
    },
    {
      email: 'employee@akuldravin.com',
      passwordHash,
      fullName: 'Employee User',
      role: Role.EMPLOYEE,
      tenantId: null,
      isActive: true,
    },
  ];

  await userRepo.save(users);
  console.log('✅ Seeded 5 users successfully');
  console.log('Login credentials:');
  console.log('  admin@akuldravin.com / password123');
  console.log('  superadmin@akuldravin.com / password123');
  console.log('  hr@akuldravin.com / password123');
  console.log('  manager@akuldravin.com / password123');
  console.log('  employee@akuldravin.com / password123');

  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
