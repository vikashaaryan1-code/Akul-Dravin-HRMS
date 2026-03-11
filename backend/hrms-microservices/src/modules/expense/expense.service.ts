import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../../database/entities/expense.entity';

@Injectable()
export class ExpenseService {
  constructor(@InjectRepository(Expense) private expenseRepository: Repository<Expense>) {}

  async create(data: any) {
    const expense = this.expenseRepository.create(data);
    return this.expenseRepository.save(expense);
  }

  async findAll(filters: any) {
    const where: any = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status;
    return this.expenseRepository.find({ where, relations: ['employee'], order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    return this.expenseRepository.findOne({ where: { id }, relations: ['employee'] });
  }

  async approve(id: string, approverId: string, remarks?: string) {
    await this.expenseRepository.update(id, { status: 'approved', approverId, remarks });
    return this.findOne(id);
  }

  async reject(id: string, approverId: string, remarks: string) {
    await this.expenseRepository.update(id, { status: 'rejected', approverId, remarks });
    return this.findOne(id);
  }
}
