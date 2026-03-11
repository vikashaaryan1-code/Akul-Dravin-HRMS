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
    const total = await this.ticketRepository.count();
    const open = await this.ticketRepository.count({ where: { status: 'open' } });
    const closed = await this.ticketRepository.count({ where: { status: 'closed' } });
    return { total, open, closed };
  }
}
