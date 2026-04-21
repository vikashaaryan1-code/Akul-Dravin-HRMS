import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanEntity } from '../../database/entities/loan.entity';

@Injectable()
export class LoanService {
  constructor(
    @InjectRepository(LoanEntity)
    private readonly loanRepository: Repository<LoanEntity>,
  ) {}

  async findAll() {
    return this.loanRepository.find({
      order: { appliedAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const loan = await this.loanRepository.findOne({ where: { id } });
    if (!loan) {
      throw new NotFoundException(`Loan record ${id} not found.`);
    }
    return loan;
  }

  async updateStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    const loan = await this.findOne(id);
    loan.status = status;
    return this.loanRepository.save(loan);
  }

  async getSummary() {
    const loans = await this.findAll();
    const pendingLoans = loans.filter(l => l.status === 'PENDING');
    const totalPendingAmount = pendingLoans.reduce((sum, l) => sum + Number(l.amount), 0);
    
    return {
      totalPendingCount: pendingLoans.length,
      totalPendingAmount,
      currency: 'INR'
    };
  }
}
