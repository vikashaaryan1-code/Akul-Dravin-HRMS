import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeServiceTicketEntity } from '../../database/entities/employee-service-ticket.entity';
import { CreateEmployeeServiceTicketDto } from './dto/create-employee-service-ticket.dto';
import { UpdateEmployeeServiceTicketDto } from './dto/update-employee-service-ticket.dto';

@Injectable()
export class EmployeeServicesService {
  private readonly logger = new Logger(EmployeeServicesService.name);

  constructor(
    @InjectRepository(EmployeeServiceTicketEntity)
    private readonly ticketRepository: Repository<EmployeeServiceTicketEntity>,
  ) {}

  findAllTickets(): Promise<EmployeeServiceTicketEntity[]> {
    return this.ticketRepository.find({ order: { createdAt: 'DESC' } });
  }

  findTicket(id: string): Promise<EmployeeServiceTicketEntity | null> {
    return this.ticketRepository.findOne({ where: { id } });
  }

  async createTicket(dto: CreateEmployeeServiceTicketDto): Promise<EmployeeServiceTicketEntity> {
    const entity = this.ticketRepository.create({
      tenantId: dto.tenantId!,
      companyId: dto.companyId!,
      employeeId: dto.employeeId,
      serviceType: dto.serviceType,
      subject: dto.subject,
      description: dto.description ?? null,
      status: 'open',
      priority: dto.priority ?? 'normal',
      assignedTo: null,
      resolutionNotes: null,
      resolvedAt: null,
    } as any) as unknown as EmployeeServiceTicketEntity;

    const saved = await this.ticketRepository.save(entity);
    this.logger.log(`Created employee service ticket id=${saved.id} employeeId=${saved.employeeId}`);
    return saved;
  }

  async updateTicket(id: string, dto: UpdateEmployeeServiceTicketDto): Promise<EmployeeServiceTicketEntity> {
    const existing = await this.findTicket(id);
    if (!existing) {
      throw new NotFoundException(`Ticket not found for id=${id}`);
    }

    const payload: Partial<EmployeeServiceTicketEntity> = {
      status: dto.status ?? existing.status,
      priority: dto.priority ?? existing.priority,
      assignedTo: dto.assignedTo ?? existing.assignedTo,
      resolutionNotes: dto.resolutionNotes ?? existing.resolutionNotes,
      resolvedAt: dto.status === 'resolved' ? new Date() : existing.resolvedAt,
    };

    await this.ticketRepository.update(id, payload);
    const updated = await this.findTicket(id);
    if (!updated) {
      throw new NotFoundException(`Ticket not found for id=${id}`);
    }

    this.logger.log(`Updated employee service ticket id=${id} status=${updated.status}`);
    return updated;
  }

  resolveTicket(id: string, dto: UpdateEmployeeServiceTicketDto): Promise<EmployeeServiceTicketEntity> {
    return this.updateTicket(id, {
      ...dto,
      status: 'resolved',
    });
  }
}
