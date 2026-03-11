import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from '../../database/entities/offer.entity';

@Injectable()
export class OfferService {
  constructor(@InjectRepository(Offer) private offerRepository: Repository<Offer>) {}

  async create(data: any) {
    const offer = this.offerRepository.create(data);
    return this.offerRepository.save(offer);
  }

  async findAll() {
    return this.offerRepository.find({ relations: ['application'], order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    return this.offerRepository.findOne({ where: { id }, relations: ['application'] });
  }

  async accept(id: string) {
    await this.offerRepository.update(id, { status: 'accepted', acceptedDate: new Date() });
    return this.findOne(id);
  }

  async reject(id: string) {
    await this.offerRepository.update(id, { status: 'rejected' });
    return this.findOne(id);
  }

  async update(id: string, data: any) {
    await this.offerRepository.update(id, data);
    return this.findOne(id);
  }
}
