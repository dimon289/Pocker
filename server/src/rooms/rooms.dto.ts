import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { roomstatus } from '@prisma/client';


export class CreateRoomDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    password?: string;

    @IsArray()
    usersid: number[];

    @IsEnum(roomstatus)
    status: roomstatus;
}

export class PatchRoomDto {
    @IsArray()
    usersid?: number[];

    @IsEnum(roomstatus)
    status?: roomstatus;
}
export type TUpdateRoomDto = Partial<CreateRoomDto>