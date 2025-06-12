import { IsBoolean, IsArray, IsInt, Length, IsOptional} from 'class-validator';
import {  } from '@prisma/client';


export class CreatePlayerDto {
    @IsInt()
    userid: number;
  
    @IsArray()
    cards: string[];
  
    @IsInt()
    roomid: number;
    
  }
export type TCreatePlayerDto = Partial<CreatePlayerDto>

  export class UpdatePlayerDto {
    @IsArray()
    @Length(2)
    @IsOptional()
    cards?: string[];
  
    @IsBoolean()
    @IsOptional()
    status?: boolean;
  }
export type TUpdatePlayerDto = Partial<UpdatePlayerDto>