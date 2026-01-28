import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsUUID, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Kedi Şampuanı' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'kedi-sampuani' })
  @IsString()
  slug: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiProperty({ example: 199.99 })
  @IsNumber()
  price: number;

  @ApiProperty({ example: 149.99, required: false })
  @IsOptional()
  @IsNumber()
  salePrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsNumber()
  stock?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  inStock?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  mainImage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  specifications?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
