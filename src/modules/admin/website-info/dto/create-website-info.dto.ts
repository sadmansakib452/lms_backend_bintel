import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWebsiteInfoDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The name of the website',
    example: 'My Website',
  })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The phone number of the website',
    example: '081234567890',
  })
  phone_number?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The email of the website',
    example: 'mywebsite@gmail.com',
  })
  email?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The address of the website',
    example: 'Jl. Raya No. 123, Jakarta, Indonesia',
  })
  address?: string;

  @IsOptional()
  @ApiProperty({
    description: 'The logo of the website',
  })
  logo?: Express.Multer.File[];

  @IsOptional()
  @ApiProperty({
    description: 'The favicon of the website',
  })
  favicon?: Express.Multer.File[];

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The copyright of the website',
    example: '© 2025 My Website. All rights reserved.',
  })
  copyright?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The cancellation policy of the website',
  })
  cancellation_policy?: string;
}
