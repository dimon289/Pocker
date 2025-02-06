import { IsEmail, IsString } from 'class-validator';
import * as bcrypt from 'bcrypt';

export class CreateUserDto {
    @IsString()
    nickname: string;

    @IsEmail()
    email: string;

    @IsString()
    password: string;
}


export type TUpdateUserDto = Partial<CreateUserDto>