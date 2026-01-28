import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  shippingFirstName: string;

  @ApiProperty()
  @IsString()
  shippingLastName: string;

  @ApiProperty()
  @IsString()
  shippingAddress: string;

  @ApiProperty()
  @IsString()
  shippingCity: string;

  @ApiProperty()
  @IsString()
  shippingDistrict: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shippingPostalCode?: string;

  @ApiProperty()
  @IsString()
  shippingPhone: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  shippingEmail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  billingFirstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  billingLastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  billingAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  billingCity?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  billingDistrict?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  billingPostalCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  billingPhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty()
  @IsString()
  paymentMethod: string;
}
