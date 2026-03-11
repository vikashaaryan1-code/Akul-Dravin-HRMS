import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './invoice.entity';

@Injectable()
export class InvoiceService {
  constructor(@InjectRepository(Invoice) private invoiceRepository: Repository<Invoice>) {}

  async findAll(): Promise<Invoice[]> {
    return this.invoiceRepository.find({ order: { issueDate: 'DESC' } });
  }

  async findOne(id: string): Promise<Invoice> {
    return this.invoiceRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Invoice>): Promise<Invoice> {
    return this.invoiceRepository.save(this.invoiceRepository.create(data));
  }

  async update(id: string, data: Partial<Invoice>): Promise<Invoice> {
    await this.invoiceRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.invoiceRepository.delete(id);
  }

  async getStats(): Promise<any> {
    const total = await this.invoiceRepository.count();
    const pending = await this.invoiceRepository.count({ where: { status: 'pending' } });
    const paid = await this.invoiceRepository.count({ where: { status: 'paid' } });
    return { total, pending, paid };
  }
}
