import { Controller, Post, Get, Put, Body, Param } from '@nestjs/common';
import { BackgroundVerificationService } from './background-verification.service';

@Controller('api/v1/background-verification')
export class BackgroundVerificationController {
  constructor(private readonly bgvService: BackgroundVerificationService) {}

  @Post('initiate')
  async initiateVerification(@Body() data: any) {
    return await this.bgvService.initiateVerification(data);
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return await this.bgvService.updateStatus(id, body.status);
  }

  @Put(':id/education')
  async updateEducation(@Param('id') id: string, @Body() data: any) {
    return await this.bgvService.updateEducationVerification(id, data);
  }

  @Put(':id/employment')
  async updateEmployment(@Param('id') id: string, @Body() data: any) {
    return await this.bgvService.updateEmploymentVerification(id, data);
  }

  @Put(':id/criminal-record')
  async updateCriminalRecord(@Param('id') id: string, @Body() data: any) {
    return await this.bgvService.updateCriminalRecordCheck(id, data);
  }

  @Put(':id/address')
  async updateAddress(@Param('id') id: string, @Body() data: any) {
    return await this.bgvService.updateAddressVerification(id, data);
  }

  @Put(':id/references')
  async updateReferences(@Param('id') id: string, @Body() data: any) {
    return await this.bgvService.updateReferenceChecks(id, data);
  }

  @Put(':id/remarks')
  async addRemarks(@Param('id') id: string, @Body() body: { remarks: string; verifiedBy: string }) {
    return await this.bgvService.addRemarks(id, body.remarks, body.verifiedBy);
  }

  @Get(':id')
  async getVerification(@Param('id') id: string) {
    return await this.bgvService.getVerification(id);
  }

  @Get('candidate/:candidateId')
  async getVerificationByCandidate(@Param('candidateId') candidateId: string) {
    return await this.bgvService.getVerificationByCandidateId(candidateId);
  }

  @Get()
  async getAllVerifications() {
    return await this.bgvService.getAllVerifications();
  }

  @Get('pending/list')
  async getPendingVerifications() {
    return await this.bgvService.getPendingVerifications();
  }
}
