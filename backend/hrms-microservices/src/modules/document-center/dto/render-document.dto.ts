import { IsString, IsOptional, IsEnum, IsObject, IsBoolean } from 'class-validator';

export enum DocumentType {
  OFFER_LETTER            = 'offer_letter',
  APPOINTMENT_LETTER      = 'appointment_letter',
  EXPERIENCE_LETTER       = 'experience_letter',
  RELIEVING_LETTER        = 'relieving_letter',
  SALARY_SLIP             = 'salary_slip',
  SALARY_CERTIFICATE      = 'salary_certificate',
  CONFIRMATION_LETTER     = 'confirmation_letter',
  PROMOTION_LETTER        = 'promotion_letter',
  INCREMENT_LETTER        = 'increment_letter',
  TRANSFER_LETTER         = 'transfer_letter',
  INTERNSHIP_OFFER        = 'internship_offer',
  INTERNSHIP_CERTIFICATE  = 'internship_certificate',
  INTERNSHIP_EXPERIENCE   = 'internship_experience',
  ID_CARD                 = 'id_card',
  VISITING_CARD           = 'visiting_card',
  BONAFIDE_CERTIFICATE    = 'bonafide_certificate',
  WARNING_LETTER          = 'warning_letter',
  TERMINATION_LETTER      = 'termination_letter',
}

export enum DesignMode {
  GLASS_3D   = 'glass_3d',   // Glassmorphic dark premium (screen)
  PRINT_CLEAN = 'print_clean', // Clean white A4 (print-ready)
  BRAND_CARD  = 'brand_card',  // ID / Visiting card format
}

export class EmployeeDocumentPayload {
  @IsString() name: string;
  @IsOptional() @IsString() employeeId?: string;
  @IsOptional() @IsString() designation?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() joinDate?: string;
  @IsOptional() @IsString() lastWorkingDay?: string;
  @IsOptional() @IsString() photoUrl?: string;
  @IsOptional() gross?: number;
  @IsOptional() net?: number;
  @IsOptional() ctc?: number;
}

export class CompanyDocumentPayload {
  @IsString() name: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() cin?: string;
  @IsOptional() @IsString() gstin?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() stampUrl?: string;
  @IsOptional() @IsString() signatureUrl?: string;
  @IsOptional() @IsString() signatoryName?: string;
  @IsOptional() @IsString() signatoryDesignation?: string;
}

export class RenderDocumentDto {
  @IsEnum(DocumentType) type: DocumentType;
  @IsEnum(DesignMode) @IsOptional() design?: DesignMode;
  @IsObject() employee: EmployeeDocumentPayload;
  @IsObject() company: CompanyDocumentPayload;
  @IsObject() @IsOptional() custom?: Record<string, unknown>;
  @IsBoolean() @IsOptional() includeSignature?: boolean;
  @IsBoolean() @IsOptional() includeStamp?: boolean;
  @IsBoolean() @IsOptional() includeQr?: boolean;
  @IsString() @IsOptional() tenantId?: string;
}
