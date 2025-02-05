import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDto } from 'src/User/user.dto';

@Injectable()
export class UserService {
    constructor(private readonly prisma:PrismaService){}

    async findEmail(email: string) {
        try {
            return await this.prisma.users.findFirst({where: { email: email }}) || null; 
        } catch (error) {
            console.error("Помилка при пошуку email:", error);
            throw new Error("Не вдалося отримати користувача");
        }
    }

    async findPassword(password: string) {
        try {
            return await this.prisma.users.findFirst({where: { password: password }})?true:false ; 
        } catch (error) {
            console.error("Помилка при пошуку паролю:", error);
            throw new Error("Не вдалося авторизуватися");
        }
    }

    async findAll() {
        try {
            const users = await this.prisma.users.findMany();
            return users;
        } catch (error) {
            console.error("Помилка підключення до БД:", error);
            throw new Error("Не вдалося отримати користувачів");
        }
    }

    create(dto: CreateUserDto){
        return this.prisma.users.create({
            data:dto,
        })
    }

}
