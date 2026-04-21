import { ApiProperty } from '@nestjs/swagger';

export class IntegrityChecksDto {
  @ApiProperty({ enum: ['PASS', 'FAIL'] })
  trialBalance!: 'PASS' | 'FAIL';

  @ApiProperty({ enum: ['PASS', 'WARN', 'FAIL'] })
  reconciliation!: 'PASS' | 'WARN' | 'FAIL';

  @ApiProperty({ enum: ['NONE', 'LOW', 'HIGH'] })
  anomalies!: 'NONE' | 'LOW' | 'HIGH';
}

export class IntegritySnapshotDto {
  @ApiProperty({ enum: ['GREEN', 'YELLOW', 'RED'] })
  health!: 'GREEN' | 'YELLOW' | 'RED';

  @ApiProperty()
  checks!: IntegrityChecksDto;

  @ApiProperty()
  totalDebits!: string;

  @ApiProperty()
  totalCredits!: string;

  @ApiProperty()
  delta!: string;
}

export class DashboardSummaryDto {
  @ApiProperty()
  snapshotAt!: Date;

  @ApiProperty()
  integrity!: IntegritySnapshotDto;

  @ApiProperty()
  reconciliation!: {
    anomalyCount: number;
    withinSLA: number;
    breachedSLA: number;
    slaMinutes: number;
    lastReconciledAt?: Date;
  };

  @ApiProperty()
  liabilities!: {
    account: string;
    accountCode: string;
    balance: string;
  }[];

  @ApiProperty()
  payroll!: {
    activeBatchesCount: number;
    totalPendingNet: string;
  };
}
