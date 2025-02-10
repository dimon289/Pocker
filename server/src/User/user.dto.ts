import { IsEmail, IsOptional, IsString, IsBoolean, IsDecimal, IsArray } from 'class-validator';

export class CreateUserDto {
    @IsString()
    nickname: string;

    @IsEmail()
    email: string;

    @IsString()
    password: string;
}

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    nickname?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    password?: string;

    @IsOptional()
    @IsDecimal()
    mybalance?: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    friends?: number[];

    @IsOptional()
    @IsArray()
    chatsid?: number[];

    @IsOptional()
    @IsBoolean()
    status?: boolean;
}
