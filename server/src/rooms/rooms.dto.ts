import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  pass?: string;

  @IsInt()
  userID: number;
}

export class JoinRoomDto {
  @IsInt()
  userID: number;

  @IsInt()
  roomID: number;
}
