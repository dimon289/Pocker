import { IsBoolean, IsArray, IsInt, Length, IsOptional} from 'class-validator';
import {  } from '@prisma/client';


export class CreatePlayerDto {
    @IsInt()
    userid: number;
  
    @IsArray()
    @Length(2, 2, { each: true })
    cards: string[];
  
    @IsInt()
    roomid: number;
    
    @IsBoolean()
    status: boolean;
  }
export type TCreatePlayerDto = Partial<CreatePlayerDto>

  export class UpdatePlayerDto {
    @IsArray()
    @Length(2, 2, { each: true })
    @IsOptional()
    cards?: string[];
  
    @IsBoolean()
    @IsOptional()
    status?: boolean;
  }
export type TUpdatePlayerDto = Partial<UpdatePlayerDto>