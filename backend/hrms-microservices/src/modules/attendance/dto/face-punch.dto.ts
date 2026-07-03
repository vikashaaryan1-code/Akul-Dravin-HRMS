import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class FacePunchDto {
  @ApiProperty({ example: 'data:image/jpeg;base64,...', description: 'Base64 encoded face photo captured at terminal' })
  @IsString()
  @IsNotEmpty()
  image: string;

  @ApiProperty({ example: 'DEV-FRONT-DESK-01', description: 'Device ID capturing face registration' })
  @IsString()
  @IsNotEmpty()
  terminalId: string;

  @ApiProperty({ example: 19.0885, description: 'Current latitude for geo-fencing check' })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 72.8821, description: 'Current longitude for geo-fencing check' })
  @IsNumber()
  lng: number;

  @ApiPropertyOptional({ example: 'EMP-1029', description: 'Optional ID code from barcode/RFID if double verification' })
  @IsOptional()
  @IsString()
  cardId?: string;
}
