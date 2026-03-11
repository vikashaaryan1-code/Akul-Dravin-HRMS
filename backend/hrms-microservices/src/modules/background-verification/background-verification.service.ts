import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BackgroundVerification } from '../../database/entities/background-verification.entity';

@Injectable()
export class BackgroundVerificationService {
  constructor(
    @InjectRepository(BackgroundVerification)
    private bgvRepo: Repository<BackgroundVerification>,
  ) {}

  async initiateVerification(data: {
    candidateId: string;
    candidateName: string;
    candidateEmail: string;
    candidatePhone: string;
  }) {
    const verification = this.bgvRepo.create({
      ...data,
      status: 'pending',
    });
    return await this.bgvRepo.save(verification);
  }

  async updateStatus(id: string, status: string) {
    await this.bgvRepo.update(id, { status });
    if (status === 'completed') {
      await this.bgvRepo.update(id, { completedAt: new Date() });
    }
    return await this.bgvRepo.findOne({ where: { id } });
  }

  async updateEducationVerification(id: string, data: any) {
    await this.bgvRepo.update(id, { educationVerification: data });
    return await this.bgvRepo.findOne({ where: { id } });
  }

  async updateEmploymentVerification(id: string, data: any) {
    await this.bgvRepo.update(id, { employmentVerification: data });
    return await this.bgvRepo.findOne({ where: { id } });
  }

  async updateCriminalRecordCheck(id: string, data: any) {
    await this.bgvRepo.update(id, { criminalRecordCheck: data });
    return await this.bgvRepo.findOne({ where: { id } });
  }

  async updateAddressVerification(id: string, data: any) {
    await this.bgvRepo.update(id, { addressVerification: data });
    return await this.bgvRepo.findOne({ where: { id } });
  }

  async updateReferenceChecks(id: string, data: any) {
    await this.bgvRepo.update(id, { referenceChecks: data });
    return await this.bgvRepo.findOne({ where: { id } });
  }

  async addRemarks(id: string, remarks: string, verifiedBy: string) {
    await this.bgvRepo.update(id, { remarks, verifiedBy });
    return await this.bgvRepo.findOne({ where: { id } });
  }

  async getVerification(id: string) {
    return await this.bgvRepo.findOne({ where: { id } });
  }

  async getVerificationByCandidateId(candidateId: string) {
    return await this.bgvRepo.findOne({ where: { candidateId } });
  }

  async getAllVerifications() {
    return await this.bgvRepo.find({ order: { createdAt: 'DESC' } });
  }

  async getPendingVerifications() {
    return await this.bgvRepo.find({ where: { status: 'pending' }, order: { createdAt: 'ASC' } });
  }
}
