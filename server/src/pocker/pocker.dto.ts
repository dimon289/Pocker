import { IsInt, IsArray, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePockerDto {
  @ApiProperty()
  @IsInt()
  roomid: number;

  @ApiProperty({ type: [Number] })
  @IsArray()
  playersid: number[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @Length(2, 2, { each: true })
  cards: string[];

  @ApiProperty()
  @IsInt()
  bank: number;
}

export class UpdatePockerDto {
  @ApiProperty({ type: [Number], required: false })
  @IsArray()
  @IsOptional()
  playersid?: number[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @Length(2, 2, { each: true })
  @IsOptional()
  cards?: string[];

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  bank?: number;
}
