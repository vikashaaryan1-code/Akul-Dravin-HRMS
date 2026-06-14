import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

jest.mock('../../common/context/tenant-context', () => ({
  TenantContext: {
    getTenantId:         jest.fn().mockReturnValue('test-tenant-id'),
    getRequiredTenantId: jest.fn().mockReturnValue('test-tenant-id'),
    getRepository:       jest.fn(),
  },
}));

import { TenantContext } from '../../common/context/tenant-context';
import { EmployeeService } from './employee.service';

const mockEmployees = [
  { id: 'emp-001', firstName: 'Meera',  lastName: 'Joshi',  employeeCode: 'EMP-001', department: 'Sales', tenantId: 'test-tenant-id', createdAt: new Date() },
  { id: 'emp-002', firstName: 'Ravi',   lastName: 'Kumar',  employeeCode: 'EMP-002', department: 'HR',    tenantId: 'test-tenant-id', createdAt: new Date() },
  { id: 'emp-003', firstName: 'Ananya', lastName: 'Rao',    employeeCode: 'EMP-003', department: 'Eng',   tenantId: 'test-tenant-id', createdAt: new Date() },
];

const makeRepo = (data = mockEmployees) => ({
  find:   jest.fn().mockResolvedValue(data),
  findOne: jest.fn().mockImplementation(({ where }: any) =>
    Promise.resolve(data.find(d => d.id === where?.id) ?? null)),
  create: jest.fn().mockImplementation((dto: any) => ({ id: 'emp-new', ...dto })),
  save:   jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity, id: entity.id ?? 'emp-new' })),
  remove: jest.fn().mockResolvedValue(undefined),
  merge:  jest.fn().mockImplementation((base: any, updates: any) => ({ ...base, ...updates })),
});

describe('EmployeeService', () => {
  let service: EmployeeService;
  let repo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    repo = makeRepo();
    (TenantContext.getRepository as jest.Mock).mockReturnValue(repo);

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmployeeService],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── findAll ─────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('should return all employees ordered by createdAt DESC', async () => {
      const result = await service.findAll();
      expect(result).toHaveLength(3);
      expect(repo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
    });

    it('should return empty array when no employees', async () => {
      repo.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────

  describe('findOne()', () => {
    it('should return an employee by id', async () => {
      const result = await service.findOne('emp-001');
      expect(result.id).toBe('emp-001');
      expect(result.firstName).toBe('Meera');
    });

    it('should throw NotFoundException when employee not found', async () => {
      await expect(service.findOne('not-exist')).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ──────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('should create an employee with tenantId attached', async () => {
      const dto = {
        firstName:   'Kabir',
        lastName:    'Shah',
        workEmail:   'kabir.shah@akuldravin.ai',
        department:  'Product',
        designation: 'Product Manager',
        employeeCode: 'EMP-099',
        dateOfJoining: '2026-01-15',
        status:      'active',
      };
      const result = await service.create(dto as any);
      expect(result.tenantId).toBe('test-tenant-id');
      expect(repo.save).toHaveBeenCalled();
    });
  });

  // ── update ──────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('should merge and save employee updates', async () => {
      const result = (await service.update('emp-001', { department: 'Finance' } as any)) as any;
      expect(result.department).toBe('Finance');
      expect(repo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when employee not found', async () => {
      await expect(service.update('not-exist', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('should remove an employee', async () => {
      await expect(service.remove('emp-001')).resolves.not.toThrow();
      expect(repo.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException when employee not found', async () => {
      await expect(service.remove('not-exist')).rejects.toThrow(NotFoundException);
    });
  });
});
