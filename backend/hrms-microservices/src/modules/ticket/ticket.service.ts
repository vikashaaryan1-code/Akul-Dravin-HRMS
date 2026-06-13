import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './ticket.entity';

@Injectable()
export class TicketService {
  constructor(@InjectRepository(Ticket) private ticketRepository: Repository<Ticket>) {}

  async findAll(): Promise<Ticket[]> {
    return this.ticketRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Ticket | null> {
    return this.ticketRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Ticket>): Promise<Ticket> {
    return this.ticketRepository.save(this.ticketRepository.create(data));
  }

  async update(id: string, data: Partial<Ticket>): Promise<Ticket | null> {
    await this.ticketRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.ticketRepository.delete(id);
  }

  async getStats(): Promise<any> {
    // Optimized: Use conditional aggregation to get all stats in a single database query
    const stats = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN ticket.status = 'open' THEN 1 ELSE 0 END)", 'open')
      .addSelect("SUM(CASE WHEN ticket.status = 'closed' THEN 1 ELSE 0 END)", 'closed')
      .getRawOne();

    return {
      total: parseInt(stats.total, 10) || 0,
      open: parseInt(stats.open, 10) || 0,
      closed: parseInt(stats.closed, 10) || 0,
    };
  }
}
