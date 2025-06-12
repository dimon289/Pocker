import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDto, UpdateUserDto } from 'src/User/user.dto';
import * as bcrypt from 'bcrypt';
import { players } from '@prisma/client';

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

    async finByPlayer(player:players){
        this.prisma.users.findUnique({where: { id: player.userid}})
    }

    async createUser(dto: CreateUserDto) {
        const hashedPassword = await bcrypt.hash(dto.password, 1);
        return this.prisma.users.create({
            data: {
                nickname: dto.nickname,
                email: dto.email,
                password: hashedPassword,
                avatar: null
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

    async updateUser(email: string, data: UpdateUserDto) {
        const user = await this.prisma.users.findUnique({
            where: { email },
        });

        if (!user) {
            throw new BadRequestException('Користувача не знайдено');
        }

        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }

        return await this.prisma.users.update({
            where: { email },
            data,
        });
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

    async updateStatus(email: string, status: boolean ) {
        return this.prisma.users.update({
            where: { email: email },  
            data: {
            status: status,
            },
        });
    }

      private onlineUsers = new Map<string, NodeJS.Timeout>();
    
      updateUserOnlineStatus(email: string) {
        // Встановлюємо статус онлайн
        this.updateStatus(email, true);
    
        // Якщо є таймер, очищаємо його
        if (this.onlineUsers.has(email)) {
          clearTimeout(this.onlineUsers.get(email));
        }
    
        // Через 10 хвилин після останньої активності ставимо офлайн
        const timeout = setTimeout(() => {
          this.updateStatus(email, false);
          this.onlineUsers.delete(email);
        }, 10 * 60 * 1000); // 10 хвилин
    
        this.onlineUsers.set(email, timeout);
      }
}
