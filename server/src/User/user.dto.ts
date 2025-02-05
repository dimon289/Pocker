import { IsEmail, IsString } from 'class-validator';

export class CreateUserDto {
    @IsString()
    nickname: string;

    @IsEmail()
    email: string;

    @IsString()
    password: string;
}


export type TUpdateUserDto = Partial<CreateUserDto>