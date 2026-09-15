import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { HelpdeskService } from './helpdesk.service';
import { HelpdeskTicketEntity } from '../../database/entities/helpdesk-ticket.entity';

describe('HelpdeskService', () => {
  let service: HelpdeskService;

  const mockTickets = [
    {
      id: 'ticket-1',
      ticketNumber: 'TCK-1001',
      subject: 'Laptop Display Issue',
      requesterId: 'user-1',
      status: 'open',
      tenantId: 'tenant-123',
      createdAt: new Date(),
      slaHours: 24,
    },
    {
      id: 'ticket-2',
      ticketNumber: 'TCK-1002',
      subject: 'VPN Connection Failure',
      requesterId: 'user-1',
      status: 'resolved',
      tenantId: 'tenant-123',
      createdAt: new Date(),
      slaHours: 12,
    },
  ];

  let qbMock: any;
  let repoMock: any;

  beforeEach(async () => {
    qbMock = {
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        withinSla: '3',
        nearBreach: '1',
        breached: '1',
      }),
    };

    repoMock = {
      find: jest.fn().mockImplementation(({ where }: any) => {
        if (where?.requesterId) {
          return Promise.resolve(mockTickets.filter(t => t.requesterId === where.requesterId));
        }
        if (where?.tenantId) {
          return Promise.resolve(mockTickets.filter(t => t.tenantId === where.tenantId));
        }
        return Promise.resolve(mockTickets);
      }),
      findOne: jest.fn().mockImplementation(({ where }: any) => {
        const ticket = mockTickets.find(t => t.id === where?.id);
        return Promise.resolve(ticket ? { ...ticket } : null);
      }),
      create: jest.fn().mockImplementation((dto: any) => ({
        id: 'ticket-new',
        ...dto,
      })),
      save: jest.fn().mockImplementation((entity: any) => Promise.resolve(entity)),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn().mockReturnValue(qbMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HelpdeskService,
        {
          provide: getRepositoryToken(HelpdeskTicketEntity),
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get<HelpdeskService>(HelpdeskService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getSlaStatus()', () => {
    it('should aggregate SLA metrics via createQueryBuilder and return correct percentages', async () => {
      const result = await service.getSlaStatus('tenant-123');

      expect(repoMock.createQueryBuilder).toHaveBeenCalledWith('t');
      expect(qbMock.where).toHaveBeenCalledWith('t.tenantId = :tenantId', { tenantId: 'tenant-123' });
      expect(qbMock.getRawOne).toHaveBeenCalled();

      // total = 3 + 1 + 1 = 5
      // Within SLA: 3/5 = 60%
      // Near Breach: 1/5 = 20%
      // Breached: 1/5 = 20%
      expect(result).toEqual([
        { name: 'Within SLA', value: 60 },
        { name: 'Near Breach', value: 20 },
        { name: 'Breached', value: 20 },
      ]);
    });

    it('should query without tenant filter when tenantId is not supplied', async () => {
      await service.getSlaStatus();

      expect(qbMock.where).not.toHaveBeenCalled();
      expect(qbMock.getRawOne).toHaveBeenCalled();
    });

    it('should handle zero ticket counts gracefully without division by zero', async () => {
      qbMock.getRawOne.mockResolvedValueOnce({
        withinSla: '0',
        nearBreach: '0',
        breached: '0',
      });

      const result = await service.getSlaStatus();

      expect(result).toEqual([
        { name: 'Within SLA', value: 0 },
        { name: 'Near Breach', value: 0 },
        { name: 'Breached', value: 0 },
      ]);
    });
  });

  describe('findAll()', () => {
    it('should return all tickets ordered by createdAt DESC', async () => {
      const result = await service.findAll();
      expect(result).toEqual(mockTickets);
      expect(repoMock.find).toHaveBeenCalledWith({ where: {}, order: { createdAt: 'DESC' } });
    });

    it('should filter by tenantId when supplied', async () => {
      await service.findAll('tenant-123');
      expect(repoMock.find).toHaveBeenCalledWith({ where: { tenantId: 'tenant-123' }, order: { createdAt: 'DESC' } });
    });
  });

  describe('findOne()', () => {
    it('should return a ticket when found', async () => {
      const ticket = await service.findOne('ticket-1');
      expect(ticket.id).toBe('ticket-1');
      expect(ticket.subject).toBe('Laptop Display Issue');
    });

    it('should throw NotFoundException when ticket does not exist', async () => {
      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByRequester()', () => {
    it('should return tickets for a specific requester', async () => {
      const tickets = await service.findByRequester('user-1');
      expect(tickets).toHaveLength(2);
      expect(repoMock.find).toHaveBeenCalledWith({ where: { requesterId: 'user-1' }, order: { createdAt: 'DESC' } });
    });
  });

  describe('create()', () => {
    it('should create and save a new ticket', async () => {
      const dto = {
        subject: 'Software License Request',
        requesterName: 'John Doe',
        tenantId: 'tenant-123',
      };

      const result = await service.create(dto);

      expect(repoMock.create).toHaveBeenCalled();
      expect(repoMock.save).toHaveBeenCalled();
      expect(result.subject).toBe('Software License Request');
      expect(result.tenantId).toBe('tenant-123');
    });
  });

  describe('update()', () => {
    it('should update ticket status and auto-stamp resolvedAt when resolved', async () => {
      const result = await service.update('ticket-1', { status: 'resolved' });

      expect(repoMock.update).toHaveBeenCalledWith(
        'ticket-1',
        expect.objectContaining({
          status: 'resolved',
          resolvedAt: expect.any(Date),
        }),
      );
      expect(result.id).toBe('ticket-1');
    });

    it('should update ticket status and auto-stamp closedAt when closed', async () => {
      await service.update('ticket-1', { status: 'closed' });

      expect(repoMock.update).toHaveBeenCalledWith(
        'ticket-1',
        expect.objectContaining({
          status: 'closed',
          closedAt: expect.any(Date),
        }),
      );
    });
  });

  describe('remove()', () => {
    it('should delete a ticket if it exists', async () => {
      await service.remove('ticket-1');
      expect(repoMock.delete).toHaveBeenCalledWith('ticket-1');
    });

    it('should throw NotFoundException when attempting to remove non-existent ticket', async () => {
      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});
