import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shift } from '../../database/entities/shift.entity';

@Injectable()
export class ShiftService {
  constructor(@InjectRepository(Shift) private shiftRepository: Repository<Shift>) {}

  async create(data: any) {
    const shift = this.shiftRepository.create(data);
    return this.shiftRepository.save(shift);
  }

  async findAll(companyId?: string) {
    const where = companyId ? { companyId } : {};
    return this.shiftRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    return this.shiftRepository.findOne({ where: { id } });
  }

  async update(id: string, data: any) {
    await this.shiftRepository.update(id, data);
    return this.findOne(id);
  }

  async delete(id: string) {
    return this.shiftRepository.delete(id);
  }
}
