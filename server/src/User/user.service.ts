import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDto } from 'src/User/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    constructor(private readonly prisma:PrismaService){}

    async findAll() {
        try {
            const users = await this.prisma.users.findMany();
            return users;
        } catch (error) {
            console.error("Помилка підключення до БД:", error);
            throw new Error("Не вдалося отримати користувачів");
        }
    }

    async findName(name: string){
        try {
            const user = await this.prisma.users.findFirst({where: { nickname: name }});
            return user || false;
        } catch (error) {
            console.error("Помилка при пошуку name:", error);
            throw new Error("Не вдалося отримати користувача");
        }
    }

    async findEmail(email: string) {
        try {
            const user = await this.prisma.users.findFirst({where: { email: email }});
            return user || false;
        } catch (error) {
            console.error("Помилка при пошуку email:", error);
            throw new Error("Не вдалося отримати користувача");
        }
    }

    async createUser(dto: CreateUserDto) {
        const hashedPassword = await bcrypt.hash(dto.password, 1);
        return this.prisma.users.create({
            data: {
                nickname: dto.nickname,
                email: dto.email,
                password: hashedPassword, // Зберігаємо лише хеш
            },
        });
    }

    async Auth(email: string, password: string) {
        try {
            const user = await this.prisma.users.findUnique({
                where: { email }
            });
            if (!user) {
                throw new Error('Користувача з такою електронною скринькою не знайдено');
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            return isPasswordValid;

        } catch (error) {
            console.error("Помилка при авторизації");
            throw new Error("Не вдалося авторизуватися");
        }
    }

    async DeleteUser(email: string, password: string): Promise<boolean> {
        const user = await this.prisma.users.findUnique({
            where: { email }
        });
    
        if (!user) {
            throw new Error('Користувача не знайдено');
        }
    
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Невірний пароль');
        }
    
        await this.prisma.users.delete({
            where: { email }
        });
    
        return true;
    }
}
