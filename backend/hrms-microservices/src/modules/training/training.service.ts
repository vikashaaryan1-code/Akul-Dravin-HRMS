import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Training } from '../../database/entities/training.entity';

@Injectable()
export class TrainingService {
  constructor(@InjectRepository(Training) private trainingRepository: Repository<Training>) {}

  async create(data: any) {
    const training = this.trainingRepository.create(data);
    return this.trainingRepository.save(training);
  }

  async findAll(companyId?: string) {
    const where = companyId ? { companyId } : {};
    return this.trainingRepository.find({ where, order: { startDate: 'DESC' } });
  }

  async findOne(id: string) {
    return this.trainingRepository.findOne({ where: { id } });
  }

  async enroll(id: string) {
    const training = await this.findOne(id);
    if (training && training.enrolled < training.capacity) {
      await this.trainingRepository.update(id, { enrolled: training.enrolled + 1 });
    }
    return this.findOne(id);
  }

  async update(id: string, data: any) {
    await this.trainingRepository.update(id, data);
    return this.findOne(id);
  }

  async delete(id: string) {
    return this.trainingRepository.delete(id);
  }
}
