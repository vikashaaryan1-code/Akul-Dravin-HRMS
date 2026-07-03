import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LeaveTypeEntity } from '../../database/entities/leave-type.entity';
import { LeaveRequestEntity } from '../../database/entities/leave-request.entity';

// ─── Mock TenantContext ────────────────────────────────────────────────────────
const mockRepo = (data: any[]) => ({
  find:    jest.fn().mockResolvedValue(data),
  findOne: jest.fn().mockImplementation(({ where }: any) =>
    Promise.resolve(data.find(d => d.id === where?.id) ?? null)),
  count:   jest.fn().mockResolvedValue(data.length),
  create:  jest.fn().mockImplementation((dto: any) => ({ id: 'new-id', ...dto })),
  save:    jest.fn().mockImplementation((entity: any) => Promise.resolve(entity)),
  update:  jest.fn().mockResolvedValue({ affected: 1 }),
});

jest.mock('../../common/context/tenant-context', () => ({
  TenantContext: {
    getTenantId:         jest.fn().mockReturnValue('test-tenant-id'),
    getRequiredTenantId: jest.fn().mockReturnValue('test-tenant-id'),
    getRepository:       jest.fn(),
  },
}));

jest.mock('../notification/notification.service');
jest.mock('../../common/audit/audit-log.service');
jest.mock('../attendance/attendance.service');

import { TenantContext } from '../../common/context/tenant-context';
import { LeaveService } from './leave.service';
import { AttendanceService } from '../attendance/attendance.service';
import { NotificationService } from '../notification/notification.service';
import { AuditLogService } from '../../common/audit/audit-log.service';

describe('LeaveService', () => {
  const mockLeaveTypes = [
    { id: 'lt-1', leaveName: 'Annual Leave',  maxDaysPerYear: 21, tenantId: 'test-tenant-id', isActive: true },
    { id: 'lt-2', leaveName: 'Sick Leave',    maxDaysPerYear: 10, tenantId: 'test-tenant-id', isActive: true },
  ];

  const mockLeaveRequests = [
    { id: 'lr-1', employeeId: 'emp-1', startDate: '2026-05-01', endDate: '2026-05-03', totalDays: 3, status: 'pending',  tenantId: 'test-tenant-id' },
    { id: 'lr-2', employeeId: 'emp-2', startDate: '2026-05-10', endDate: '2026-05-10', totalDays: 1, status: 'approved', tenantId: 'test-tenant-id' },
  ];

  let service: LeaveService;
  let typeRepoMock: ReturnType<typeof mockRepo>;
  let requestRepoMock: ReturnType<typeof mockRepo>;
  let auditLogMock: jest.Mocked<AuditLogService>;
  let notifMock: jest.Mocked<NotificationService>;
  let attendanceMock: jest.Mocked<AttendanceService>;

  const mockDataSource = {
    getRepository: jest.fn().mockReturnValue({
      findOne: jest.fn().mockResolvedValue({ companyId: 'CO-001', workEmail: 'test@company.com' }),
    }),
  };

  beforeEach(async () => {
    typeRepoMock    = mockRepo(mockLeaveTypes);
    requestRepoMock = mockRepo(mockLeaveRequests);

    (TenantContext.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === LeaveTypeEntity) return typeRepoMock;
      if (entity === LeaveRequestEntity) return requestRepoMock;
      return null;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveService,
        { provide: DataSource,          useValue: mockDataSource },
        { provide: AttendanceService,   useValue: { create: jest.fn().mockResolvedValue({}) } },
        { provide: NotificationService, useValue: { create: jest.fn().mockResolvedValue({ id: 'notif-1' }), enqueue: jest.fn() } },
        { provide: AuditLogService,     useValue: { log: jest.fn().mockResolvedValue(undefined) } },
      ],
    })
    .overrideProvider(DataSource).useValue(mockDataSource)
    .compile();

    service      = module.get<LeaveService>(LeaveService);
    auditLogMock = module.get(AuditLogService);
    notifMock    = module.get(NotificationService);
    attendanceMock = module.get(AttendanceService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAllLeaveTypes()', () => {
    it('should return leave types ordered by name', async () => {
      const result = await service.findAllLeaveTypes();
      expect(result).toEqual(mockLeaveTypes);
      expect(typeRepoMock.find).toHaveBeenCalledWith({ order: { leaveName: 'ASC' } });
    });
  });

  describe('findAllLeaveRequests()', () => {
    it('should return all leave requests ordered by createdAt DESC', async () => {
      const result = await service.findAllLeaveRequests();
      expect(result).toEqual(mockLeaveRequests);
    });
  });

  describe('findLeaveRequest()', () => {
    it('should return leave request by id', async () => {
      const result = await service.findLeaveRequest('lr-1');
      expect(result.id).toBe('lr-1');
    });

    it('should throw NotFoundException when not found', async () => {
      await expect(service.findLeaveRequest('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createLeaveRequest()', () => {
    it('should throw BadRequestException when endDate < startDate', async () => {
      await expect(service.createLeaveRequest({
        employeeId: 'emp-1',
        startDate:  '2026-05-10',
        endDate:    '2026-05-05',
        leaveTypeId: 'lt-1',
        reason: 'test',
        totalDays: '0',
      })).rejects.toThrow(BadRequestException);
    });

    it('should create a leave request with status=pending_manager', async () => {
      const result = await service.createLeaveRequest({
        employeeId:  'emp-1',
        startDate:   '2026-05-20',
        endDate:     '2026-05-22',
        leaveTypeId: 'lt-1',
        reason:      'Vacation',
        totalDays:   '3',
      });
      expect(result.status).toBe('pending_manager');
      expect(requestRepoMock.save).toHaveBeenCalled();
    });
  });
});
