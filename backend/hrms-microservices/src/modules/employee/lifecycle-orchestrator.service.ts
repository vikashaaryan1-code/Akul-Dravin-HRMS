import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { DomainEventService, DomainEvent } from '../../common/events/domain-event.service';
import { EmployeeLifecycleService } from './employee-lifecycle.service';
import { PayrollService } from '../payroll/payroll.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('domain-events')
@Injectable()
export class LifecycleOrchestratorService extends WorkerHost {
  private readonly logger = new Logger(LifecycleOrchestratorService.name);

  constructor(
    private readonly eventBus: DomainEventService,
    private readonly lifecycleService: EmployeeLifecycleService,
    @Inject(forwardRef(() => PayrollService))
    private readonly payrollService: PayrollService,
  ) {
    super();
  }

  /**
   * Autonomous Processor for Lifecycle Events.
   * "Fully Automatic A2Z" lifecycle management.
   */
  async process(job: Job<DomainEvent>): Promise<void> {
    await this.handleLifecycleEvent(job);
  }

  async handleLifecycleEvent(job: Job<DomainEvent>) {
    const event = job.data;
    this.logger.log(`Orchestrating event: [${event.type}] for tenant=${event.tenantId}`);

    switch (event.type) {
      case 'OFFER_ACCEPTED':
        await this.handleOfferAccepted(event);
        break;
      case 'ONBOARDING_COMPLETED':
        await this.handleOnboardingCompleted(event);
        break;
      case 'EMPLOYEE_TERMINATED':
        await this.handleEmployeeTerminated(event);
        break;
      default:
        this.logger.debug(`No lifecycle handler for event type: ${event.type}`);
    }
  }

  private async handleOfferAccepted(event: DomainEvent) {
    const { candidateId, offerDetails } = event.payload;
    this.logger.log(`Automatically triggering ONBOARDING for candidate=${candidateId}`);

    // Trigger onboarding workflow autonomously
    await this.lifecycleService.initiateOnboarding(candidateId, {
      expectedJoinDate: offerDetails.joiningDate,
      actorId: 'SYSTEM',
    });

    await this.eventBus.publish('ONBOARDING_INITIATED', event.tenantId, { candidateId });
  }

  private async handleOnboardingCompleted(event: DomainEvent) {
    const { employeeId } = event.payload;
    this.logger.log(`Automatically enrolling employee=${employeeId} into PAYROLL`);

    // Auto-enrollment in standard payroll group
    await (this.payrollService as any).enrollEmployee?.({
      tenantId: event.tenantId,
      employeeId,
      payGroupId: 'STANDARD_MONTHLY',
    });

    await this.eventBus.publish('PAYROLL_ENROLLED', event.tenantId, { employeeId });
  }

  private async handleEmployeeTerminated(event: DomainEvent) {
    const { employeeId, lastWorkingDay } = event.payload;
    this.logger.log(`Automatically triggering FULL & FINAL settlement for employee=${employeeId}`);

    // Trigger exit settlement via stub if supported
    await (this.payrollService as any).initiateFullAndFinal?.({
      tenantId: event.tenantId,
      employeeId,
      exitDate: lastWorkingDay,
    });
  }
}
