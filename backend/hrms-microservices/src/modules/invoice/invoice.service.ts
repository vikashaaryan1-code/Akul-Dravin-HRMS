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
    // ⚡ Bolt: Performance Optimization
    // Consolidating 3 sequential count queries into 1 query using conditional aggregation.
    // Impact: Reduces database round-trips from 3 to 1, significantly lowering latency for stats calculation.
    const stats = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('COUNT(invoice.id)', 'total')
      .addSelect("SUM(CASE WHEN invoice.status = 'pending' THEN 1 ELSE 0 END)", 'pending')
      .addSelect("SUM(CASE WHEN invoice.status = 'paid' THEN 1 ELSE 0 END)", 'paid')
      .getRawOne();

    return {
      total: parseInt(stats.total, 10) || 0,
      pending: parseInt(stats.pending, 10) || 0,
      paid: parseInt(stats.paid, 10) || 0,
    };
  }
}
