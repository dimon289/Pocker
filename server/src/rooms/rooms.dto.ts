import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';


export enum RoomStatus {
    Waiting = 'Waiting',
    Playing = 'Playing',
    Full = 'Full',
}

export class CreateRoomDto {
    
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    password?: string;

    @IsArray()
    usersid: number[];

    @IsEnum(RoomStatus)
    status: RoomStatus;
}

export class PatchRoomDto {
    @IsArray()
    usersid?: number[];

    @IsEnum(RoomStatus)
    status?: RoomStatus;
}
export type TUpdateRoomDto = Partial<CreateRoomDto>